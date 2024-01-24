from flask import Flask, render_template, request, jsonify
from PIL import Image
import io
import base64
import torch
from torchvision import transforms
from torch import nn

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

# Load the model
model.load_state_dict(torch.load('./mnist_model.pth'))
model.eval()

# Check if a GPU is available and if not, use a CPU
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
model.to(device)


app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    # Get the image data from the POST request
    data = request.get_json()
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

    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)