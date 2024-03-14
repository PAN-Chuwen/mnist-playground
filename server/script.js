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
    processImageAndFeedback();
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

function processImageAndFeedback() {
    let dataUrl = canvas.toDataURL();
    sendImage(dataUrl)
        .then(changeButtonColors)
        .then(waitForUserFeedback)
        .then(sendFeedbackToServer)
        .then(res => {
            console.log(res.status);
        }
        )
}

async function sendImage(dataUrl) {
    return fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: dataUrl
        })
    })
        .then(response => response.json());
}

function changeButtonColors(data) {
    let predictionResult = data.result;
    let predictedButton = document.getElementById('btn' + predictionResult);
    predictedButton.style.backgroundColor = 'green';
    let buttons = document.getElementById('prediction-btns').children;
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i] !== predictedButton) {
            buttons[i].style.backgroundColor = 'red';
        }
    }
    return data;
}

async function waitForUserFeedback(data) {
    let buttons = document.getElementById('prediction-btns').children;
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
    return Promise.race([buttonClickPromise, canvasDrawPromise]);
}


async function sendFeedbackToServer(result) {
    return fetch('/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
    })
        .then(response => response.json())
}