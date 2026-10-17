let model = null;
let stream = null;
let running = false;

const video = document.getElementById("camera");
const canvas = document.getElementById("camera-canvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start-camera");
const stopBtn = document.getElementById("stop-camera");
const results = document.getElementById("camera-results");
const modelStatus = document.getElementById("model-status");

function t(key) {
    return window.i18n ? window.i18n.t(key) : key;
}

async function loadModel(){
    try{
        if(modelStatus) modelStatus.textContent = t("camera.loading");
        model = await cocoSsd.load({ base:"lite_mobilenet_v2" });
        if(modelStatus) modelStatus.textContent = t("camera.ready");
    }catch(error){
        if(modelStatus) modelStatus.textContent = t("camera.failed");
    }
}

loadModel();

async function startCamera(){
    if(!model) return;
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video:{ width:640, height:480 }
        });
        video.srcObject = stream;
        video.addEventListener("loadeddata",()=>{
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.style.width = video.videoWidth + "px";
            canvas.style.height = video.videoHeight + "px";
            running = true;
            detect();
        });
    } catch (error) {
        if(modelStatus) modelStatus.textContent = "Camera access denied.";
    }
}

function stopCamera(){
    running = false;
    if(stream){
        stream.getTracks().forEach(track=>{ track.stop(); });
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    results.innerHTML="";
}

async function detect(){
    if(!running) return;

    const predictions = await model.detect(video);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    results.innerHTML="";

    predictions.forEach((prediction)=>{
        const b = prediction.bbox;
        const x = b[0], y = b[1], w = b[2], h = b[3];

        ctx.strokeStyle="#2563eb";
        ctx.lineWidth=3;
        ctx.strokeRect(x,y,w,h);

        ctx.fillStyle="#2563eb";
        ctx.font="16px Arial";
        ctx.fillText(
            prediction.class + " " + Math.round(prediction.score*100) + "%",
            x,
            y>20 ? y-5 : 20
        );

        const item = document.createElement("div");
        item.className="camera-item";
        item.textContent = prediction.class + " " + Math.round(prediction.score*100) + "%";
        results.appendChild(item);
    });

    requestAnimationFrame(detect);
}

startBtn.addEventListener("click",()=>{ startCamera(); });
stopBtn.addEventListener("click",()=>{ stopCamera(); });

window.addEventListener("languageChanged", () => {
    if(modelStatus) modelStatus.textContent = model ? t("camera.ready") : t("camera.loading");
});
