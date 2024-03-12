from aiohttp import web
from aiohttp.web_request import Request
from aiohttp.web_response import Response
from PIL import Image
import io
import base64
import torch
from torchvision import transforms
from torch import nn
import json
import os

# Model architecture
model = nn.Sequential(
    nn.Linear(784, 128),
    nn.ReLU(),
    nn.Linear(128, 64),
    nn.ReLU(),
    nn.Linear(64, 10),
    nn.LogSoftmax(dim=1)
)

# Load the model
# Get the directory of the current script
script_dir = os.path.dirname(os.path.realpath(__file__))

# Construct the path to the model file
model_path = os.path.join(script_dir, 'mnist_model.pth')

# Load the model
model.load_state_dict(torch.load(model_path))

model.eval()

# Check if a GPU is available and if not, use a CPU
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
model.to(device)

async def predict(request: Request) -> Response:
    # Get the image data from the POST request
    data = await request.json()
    image_data = data['image']
    image_data = base64.b64decode(image_data.split(',')[1])

    # Open the image and convert it to grayscale
    image = Image.open(io.BytesIO(image_data)).convert('L')
    

    # Resize the image to 28x28
    image = image.resize((28, 28))

    # Save the image to a file
    image.save('received_image.png')

    # Resize and normalize the image
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])
    image = transform(image)

    # Add a batch dimension, treat the image as a batch of size 1
    image = image.unsqueeze(0)

    # Flatten the image
    image = image.view(image.shape[0], -1)

    # Move the image to the device
    image = image.to(device)

    # Get the model's predictions
    output = model(image)
    probabilities = torch.nn.functional.softmax(output, dim=1)
    print(probabilities)

    _, predicted = torch.max(output.data, 1)

    # Convert the result to a Python number
    result = predicted.item()
    print(result)

    return web.json_response({'result': result})

# Serve the index.html file
async def index(request):
    index_path = os.path.join(script_dir, 'index.html')
    return web.FileResponse(index_path)

# Serve the script.js file
async def script(request):
    script_path = os.path.join(script_dir, 'script.js')
    return web.FileResponse(script_path)

app = web.Application()
app.router.add_get('/', index)
app.router.add_get('/script.js', script)
app.router.add_post('/predict', predict)

if __name__ == '__main__':
    web.run_app(app)