from flask import Flask, render_template, request, jsonify
from PIL import Image
import io
import base64
import torch
from torchvision import transforms

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    image_data = data['image']
    image_data = base64.b64decode(image_data.split(',')[1])
    image = Image.open(io.BytesIO(image_data)).convert('L')
    image = transforms.ToTensor()(image).unsqueeze(0)


    # Random naive model, just gives random results regardless of input
    def model(images):
        batch_size = images.shape[0]  # Get the batch size from the images tensor
        num_classes = 10  # Define the number of classes (10 for MNIST)
        return torch.randint(0, 2, (batch_size, num_classes))  # Return a tensor of random integers
    # Use your model for inference here
    
    output = model(image)  # Make a prediction
    _, predicted = torch.max(output.data, 1)  # Get the class with the highest probability
    result = predicted.item()  # Convert the result to a Python number

    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)