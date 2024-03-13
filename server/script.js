let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let painting = false;

// Set the background to black
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);


canvas.addEventListener('mousedown', (e) => {
    painting = true;
    draw(e);
});
canvas.addEventListener('mouseup', () => {
    painting = false;
    ctx.beginPath();
    sendImageToServer();
});
canvas.addEventListener('mousemove', draw);

function draw(e) {
    if (!painting) return;
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'white';

    let x = e.clientX - canvas.offsetLeft;
    let y = e.clientY - canvas.offsetTop;

    console.log(`Drawing at ${x}, ${y}`);  // Log the position of the mouse

    ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
}

document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

function sendImageToServer() {
    let dataUrl = canvas.toDataURL();
    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: dataUrl
        })
    })
        .then(response => response.json())
        .then(data => {
            // Use the predicted result to change the color of the buttons
            let predictionResult = data.result;
            // Select button with the predicted digit
            let predictedButton = document.getElementById('btn' + predictionResult);
            // Change the color of the button to green
            predictedButton.style.backgroundColor = 'green';
            // Change the color of the other buttons to red
            let buttons = document.getElementById('prediction-btns').children;
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i] !== predictedButton) {
                    buttons[i].style.backgroundColor = 'red';
                }
            }

            // Wait for either user click or new drawing on canvas
            let buttonClickPromise = new Promise((resolve) => {
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].addEventListener('click', () => {
                        resolve({ inferenceResult: data.result, feedbackResult: i });
                    });
                }
            });
            let canvasDrawPromise = new Promise((resolve) => {
                canvas.addEventListener('mousedown', () => {
                    resolve();
                });
            });

            // When either of the promises resolves:
            return Promise.race([buttonClickPromise, canvasDrawPromise]);
        })
        .then((userFeedback) => {
            // Reset the color of buttons
            let buttons = document.getElementById('prediction-btns').children;
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].style.backgroundColor = 'white';
            }
            // Send the feedback to the server
            sendFeedbackToServer(userFeedback.inferenceResult, userFeedback.feedbackResult);
        })
        .then((response) => console.log(response.json));
}

function sendFeedbackToServer(inferenceResult, userFeedback, userDrawnImage) {
    fetch('/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inferenceResult: inferenceResult,
            userFeedback: userFeedback,
            userDrawnImage: userDrawnImage
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Feedback sent to server');
        });
}