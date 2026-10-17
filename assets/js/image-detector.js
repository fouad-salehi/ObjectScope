let model = null;

let isModelLoading = false;
let isDetecting = false;

const CONFIDENCE_THRESHOLD = 0.50;

const imageUpload = document.getElementById("image-upload");
const image = document.getElementById("preview-image");
const canvas = document.getElementById("detection-canvas");
const results = document.getElementById("results");
const modelStatus = document.getElementById("model-status");

const ctx = canvas.getContext("2d");


function t(key) {
    return window.i18n ? window.i18n.t(key) : key;
}

function status(text) {
    if (modelStatus) modelStatus.textContent = text;
}

function clearResults() { results.innerHTML = ""; }
function clearCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

function showError(text) {
    const div = document.createElement("div");
    div.className = "result-item error";
    div.textContent = text;
    results.appendChild(div);
}

async function loadModel() {
    if (isModelLoading || model) return;
    isModelLoading = true;
    status(t("detection.loading"));

    if (typeof cocoSsd === "undefined") {
        status(t("detection.failed"));
        isModelLoading = false;
        return;
    }

    const start = performance.now();

    try {
        const loadPromise = cocoSsd.load({ base: "lite_mobilenet_v2" });
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("TIMEOUT")), 60000);
        });
        model = await Promise.race([loadPromise, timeoutPromise]);
        const seconds = ((performance.now() - start) / 1000).toFixed(2);
        status(t("detection.ready") + " (" + seconds + "s)");
        isModelLoading = false;
        if (image.complete && image.naturalWidth > 0) detectObjects();
    } catch (error) {
        model = null;
        isModelLoading = false;
        status(t("detection.failed"));
    }
}

imageUpload.addEventListener("change", event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    clearCanvas();
    clearResults();

    const url = URL.createObjectURL(file);

    image.onload = () => {
        URL.revokeObjectURL(url);
        image.style.display = "block";
        if (model) detectObjects();
        else status(t("detection.loading"));
    };

    image.src = url;
});

async function detectObjects() {
    if (!model) return;
    if (!image.complete || image.naturalWidth === 0) return;
    if (isDetecting) return;

    isDetecting = true;

    try {
        status(t("detection.loading"));
        clearCanvas();
        clearResults();

        const width = image.clientWidth;
        const height = image.clientHeight;
        if (!width || !height) throw new Error("Invalid size");

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        const predictions = await model.detect(image);

        const detections = predictions
            .filter(p => p.score >= CONFIDENCE_THRESHOLD)
            .sort((a, b) => b.score - a.score);

        const scaleX = width / image.naturalWidth;
        const scaleY = height / image.naturalHeight;

        detections.forEach((prediction, index) => {
            const b = prediction.bbox;
            const bx = b[0] * scaleX;
            const by = b[1] * scaleY;
            const bw = b[2] * scaleX;
            const bh = b[3] * scaleY;
            const confidence = Math.round(prediction.score * 100);

            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = 3;
            ctx.strokeRect(bx, by, bw, bh);

            const label = prediction.class + " " + confidence + "%";
            ctx.font = "bold 15px Arial";
            const textWidth = ctx.measureText(label).width;
            const labelWidth = textWidth + 10;
            const labelHeight = 24;

            let labelX = bx;
            let labelY = by - labelHeight;
            if (labelY < 0) labelY = by;
            if (labelX + labelWidth > canvas.width) labelX = canvas.width - labelWidth;

            ctx.fillStyle = "#2563eb";
            ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(label, labelX + 5, labelY + 17);

            const item = document.createElement("div");
            item.className = "result-item";
            item.textContent = (index + 1) + ". " + prediction.class + " — " + confidence + "%";
            results.appendChild(item);
        });

        if (!detections.length) {
            const item = document.createElement("div");
            item.className = "result-item";
            item.textContent = t("detection.noObjects");
            results.appendChild(item);
        }

        status(t("detection.ready") + " — " + detections.length);

    } catch (error) {
        status(t("detection.failed"));
    } finally {
        isDetecting = false;
    }
}

window.addEventListener("languageChanged", () => {
    if (model) status(t("detection.ready"));
    else status(t("detection.loading"));
});

loadModel();
