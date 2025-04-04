const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('tooltip');
    const sizePreview = document.getElementById('sizePreview');
    
    // Elements
    const colorPicker = document.getElementById('colorPicker');
    const sizeSlider = document.getElementById('sizeSlider');
    const brushBtn = document.getElementById('brush');
    const eraserBtn = document.getElementById('eraser');
    const lineBtn = document.getElementById('line');
    const rectBtn = document.getElementById('rect');
    const circleBtn = document.getElementById('circle');
    const clearBtn = document.getElementById('clear');
    const undoBtn = document.getElementById('undo');
    const downloadBtn = document.getElementById('download');
    
    // Drawing state
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentTool = 'brush';
    let brushColor = '#000000';
    let brushSize = 5;
    let prevColor = brushColor;
    const drawHistory = [];
    let startX, startY;
    
    // Resize canvas to fit container
    function resizeCanvas() {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Redraw canvas when resized
      if (drawHistory.length > 0) {
        const lastImage = drawHistory[drawHistory.length - 1];
        ctx.drawImage(lastImage, 0, 0);
      }
    }
    
    // Initial resize and event listener for window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Tool selection
    function setActiveTool(tool) {
      // Remove active class from all buttons
      [brushBtn, eraserBtn, lineBtn, rectBtn, circleBtn].forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Set active class on selected tool
      document.getElementById(tool).classList.add('active');
      currentTool = tool;
      
      // Special handling for eraser
      if (tool === 'eraser') {
        prevColor = brushColor;
        brushColor = '#FFFFFF';
      } else if (prevColor && tool === 'brush') {
        brushColor = prevColor;
        colorPicker.value = brushColor;
      }
    }
    
    // Save canvas state for undo
    function saveState() {
      const image = new Image();
      image.src = canvas.toDataURL();
      drawHistory.push(image);
      
      // Limit history size to prevent memory issues
      if (drawHistory.length > 20) {
        drawHistory.shift();
      }
    }
    
    // Undo last drawing action
    function undo() {
      if (drawHistory.length > 0) {
        drawHistory.pop(); // Remove current state
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw previous state if exists
        if (drawHistory.length > 0) {
          ctx.drawImage(drawHistory[drawHistory.length - 1], 0, 0);
        }
      }
    }
    
    // Clear canvas completely
    function clearCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawHistory.length = 0; // Clear history
      saveState(); // Save empty state
    }
    
    // Download canvas as PNG
    function downloadCanvas() {
      const link = document.createElement('a');
      link.download = 'drawing.png';
      link.href = canvas.toDataURL();
      link.click();
    }
    
    // Update brush size preview
    function updateSizePreview() {
      sizePreview.style.width = `${brushSize}px`;
      sizePreview.style.height = `${brushSize}px`;
      sizePreview.style.background = brushColor;
    }
    
    // Drawing functions
    function startDrawing(e) {
      isDrawing = true;
      
      // Get canvas-relative coordinates
      const rect = canvas.getBoundingClientRect();
      lastX = (e.clientX || e.touches[0].clientX) - rect.left;
      lastY = (e.clientY || e.touches[0].clientY) - rect.top;
      
      // For shape tools, save starting position
      startX = lastX;
      startY = lastY;
      
      // For brush and eraser, draw a single dot
      if (currentTool === 'brush' || currentTool === 'eraser') {
        ctx.beginPath();
        ctx.arc(lastX, lastY, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = brushColor;
        ctx.fill();
      }
    }
    
    function draw(e) {
      if (!isDrawing) return;
      
      // Get canvas-relative coordinates
      const rect = canvas.getBoundingClientRect();
      const currentX = (e.clientX || e.touches[0].clientX) - rect.left;
      const currentY = (e.clientY || e.touches[0].clientY) - rect.top;
      
      // Show tooltip with coordinates
      tooltip.style.display = 'block';
      tooltip.style.left = `${e.clientX + 10}px`;
      tooltip.style.top = `${e.clientY + 10}px`;
      tooltip.textContent = `X: ${Math.round(currentX)}, Y: ${Math.round(currentY)}`;
      
      if (currentTool === 'brush' || currentTool === 'eraser') {
        // Draw line from last position to current position
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw circle at current position for smoother lines
        ctx.beginPath();
        ctx.arc(currentX, currentY, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = brushColor;
        ctx.fill();
      } else if (currentTool === 'line' || currentTool === 'rect' || currentTool === 'circle') {
        // For shape tools, we'll preview on the existing canvas and draw the final shape on mouseup
        // Create a copy of the canvas before drawing
        const tempImage = new Image();
        tempImage.src = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1].src : canvas.toDataURL();
        
        // Clear canvas and redraw the previous state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (drawHistory.length > 0) {
          ctx.drawImage(drawHistory[drawHistory.length - 1], 0, 0);
        }
        
        // Draw the current shape
        ctx.beginPath();
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        
        if (currentTool === 'line') {
          ctx.moveTo(startX, startY);
          ctx.lineTo(currentX, currentY);
        } else if (currentTool === 'rect') {
          ctx.rect(
            Math.min(startX, currentX),
            Math.min(startY, currentY),
            Math.abs(currentX - startX),
            Math.abs(currentY - startY)
          );
        } else if (currentTool === 'circle') {
          const radius = Math.sqrt(
            Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
          );
          ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        }
        
        ctx.stroke();
      }
      
      // Update last position
      lastX = currentX;
      lastY = currentY;
    }
    
    function stopDrawing() {
      if (!isDrawing) return;
      isDrawing = false;
      tooltip.style.display = 'none';
      
      // Save current state for undo
      saveState();
    }
    
    // Mouse event handlers
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch event handlers for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      startDrawing(e);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      draw(e);
    });
    canvas.addEventListener('touchend', stopDrawing);
    
    // Control event handlers
    colorPicker.addEventListener('change', () => {
      brushColor = colorPicker.value;
      if (currentTool !== 'eraser') {
        prevColor = brushColor;
      }
      updateSizePreview();
    });
    
    sizeSlider.addEventListener('input', () => {
      brushSize = parseInt(sizeSlider.value);
      updateSizePreview();
    });
    
    brushBtn.addEventListener('click', () => setActiveTool('brush'));
    eraserBtn.addEventListener('click', () => setActiveTool('eraser'));
    lineBtn.addEventListener('click', () => setActiveTool('line'));
    rectBtn.addEventListener('click', () => setActiveTool('rect'));
    circleBtn.addEventListener('click', () => setActiveTool('circle'));
    clearBtn.addEventListener('click', clearCanvas);
    undoBtn.addEventListener('click', undo);
    downloadBtn.addEventListener('click', downloadCanvas);
    
    // Initialize
    saveState(); // Save initial empty state
    updateSizePreview();
