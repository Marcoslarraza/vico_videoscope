
    // Cargar el video en el reproductor HTML5
    var video = document.getElementById("video");
    
    // Crear un canvas para el gráfico de vectorscope
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    
    // Configuración de gráfico
    var width = canvas.width;
    var height = canvas.height;
    var radius = Math.min(width, height) / 2;
    
    // Extraer los datos de color del video utilizando ffmpeg.js
    var frameBuffer = null;
    var frameCanvas = document.createElement("canvas");
    frameCanvas.width = video.videoWidth;
    frameCanvas.height = video.videoHeight;
    var ffmpeg = createFFmpeg({
      log: true,
      corePath: "https://cdnjs.cloudflare.com/ajax/libs/ffmpeg.js/1.8.3/ffmpeg-core.js",
    });
    await ffmpeg.load();
    ffmpeg.FS("writeFile", "video.mp4", await fetch("/path/to/vide.mp4").then(response => response.arrayBuffer()));
    var interval = setInterval(async function() {
      if (video.paused || video.ended) {
        clearInterval(interval);
        return;
      }
      // extraer el cuadro del video
      var seekTime = video.currentTime;
      var cmd = `-i video.mp4 -ss ${seekTime} -vframes 1 -f image2pipe -pix_fmt rgb24 -vcodec rawvideo -`;
      frameBuffer = await ffmpeg.run("ffmpeg", {
        args: cmd.split(" "),
        MEMFS: [{name: "video.mp4", data: await fetch("/path/to/video.mp4").then(response => response.arrayBuffer())}],
        stdin: null,
        stdout: true,
        stderr: true,
      });
      // convertir los datos de color en coordenadas polares utilizando p5.js
      var pixels = new Uint8ClampedArray(frameBuffer);
      var img = new p5.Image(video.videoWidth, video.videoHeight);
      img.loadPixels();
      for (var i = 0; i < pixels.length; i += 4) {
        img.pixels[i / 4] = pixels[i];
        img.pixels[i / 4 + 1] = pixels[i + 1];
        img.pixels[i / 4 + 2] = pixels[i + 2];
      }
      img.updatePixels();
      var polarData = [];
      for (var y = 0; y < img.height; y++) {
        for (var x = 0; x < img.width; x++) {
          var index = (x + y * img.width) * 4;
          var r = pixels[index]
          var g = pixels[index + 1];
      var b = pixels[index + 2];
      var rNormalized = r / 255;
      var gNormalized = g / 255;
      var bNormalized = b / 255;
      var theta = Math.acos((2 * rNormalized - gNormalized - bNormalized) / 2);
      var phi = Math.atan2(Math.sqrt(3) * (gNormalized - bNormalized), 2 * rNormalized - gNormalized - bNormalized);
      polarData.push({theta: theta, phi: phi});
    }
  }
  // Dibujar el gráfico de vectorscope utilizando d3.js
  var data = polarData.map(function(d) {return [d.phi, d.theta]});
  var xScale = d3.scaleLinear().domain([-Math.PI, Math.PI]).range([0, width]);
  var yScale = d3.scaleLinear().domain([0, Math.PI]).range([0, height]);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "white";
  context.strokeStyle = "white";
  context.beginPath();
  context.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
  context.stroke();
  context.beginPath();
  data.forEach(function(d) {
    var x = xScale(d[0]);
    var y = yScale(d[1]);
    context.lineTo(x, y);
  });
  context.closePath();
  context.fill();
}, 1000 / 30); // actualización de 30 fps
