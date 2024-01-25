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
model.load_state_dict(torch.load('./mnist_model.pth'))
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
    # Save the image to a file
    image.save('received_image.png')

    # Resize and normalize the image
    transform = transforms.Compose([
        transforms.Resize((28, 28)),
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])
    image = transform(image)

    # Add a batch dimension and flatten the image
    image = image.unsqueeze(0)
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
    return web.FileResponse('./index.html')

# Serve the script.js file
async def script(request):
    return web.FileResponse('./script.js')

app = web.Application()
app.router.add_get('/', index)
app.router.add_get('/script.js', script)
app.router.add_post('/predict', predict)

if __name__ == '__main__':
    web.run_app(app)