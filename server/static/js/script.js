let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let painting = false;

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
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    let x = e.clientX - canvas.offsetLeft;
    let y = e.clientY - canvas.offsetTop;

    console.log(`Drawing at ${x}, ${y}`);  // Log the position of the mouse

    ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
}

document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        document.getElementById('result').textContent = 'Predicted digit: ' + data.result;
    });
}