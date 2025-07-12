import React, { useState, useRef, useEffect } from 'react';

// Popular meme templates with base64 encoded images (small versions for demo)
const MEME_TEMPLATES = [
  {
    id: 1,
    name: "Drake Hotline Bling",
    url: "https://i.imgflip.com/30b1gx.jpg",
    width: 300,
    height: 300
  },
  {
    id: 2,
    name: "Two Buttons",
    url: "https://i.imgflip.com/1g8my4.jpg",
    width: 300,
    height: 300
  },
  {
    id: 3,
    name: "Distracted Boyfriend",
    url: "https://i.imgflip.com/1ur9b0.jpg",
    width: 300,
    height: 300
  },
  {
    id: 4,
    name: "Change My Mind",
    url: "https://i.imgflip.com/24y43o.jpg",
    width: 300,
    height: 300
  },
  {
    id: 5,
    name: "Left Exit 12 Off Ramp",
    url: "https://i.imgflip.com/22bdq6.jpg",
    width: 300,
    height: 300
  },
  {
    id: 6,
    name: "American Chopper Argument",
    url: "https://i.imgflip.com/2896ro.jpg",
    width: 300,
    height: 300
  },
  {
    id: 7,
    name: "Hide the Pain Harold",
    url: "https://i.imgflip.com/gk5el.jpg",
    width: 300,
    height: 300
  },
  {
    id: 8,
    name: "Expanding Brain",
    url: "https://i.imgflip.com/1jwhww.jpg",
    width: 300,
    height: 300
  },
  {
    id: 9,
    name: "Disaster Girl",
    url: "https://i.imgflip.com/23ls.jpg",
    width: 300,
    height: 300
  }
];

export const MemeTemplate = ({ template, onSelect, selected }) => {
  return (
    <div 
      className={`meme-template ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(template)}
    >
      <img src={template.url} alt={template.name} />
      <div className="template-name">{template.name}</div>
    </div>
  );
};

export const MemeCanvas = ({ selectedTemplate, customImage, textLines, fontFamily, fontSize, textColor }) => {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (selectedTemplate || customImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
        drawMeme(img);
      };
      img.src = customImage || selectedTemplate.url;
    }
  }, [selectedTemplate, customImage]);

  useEffect(() => {
    if (image) {
      drawMeme(image);
    }
  }, [textLines, fontFamily, fontSize, textColor, image]);

  const drawMeme = (img) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 500;
    canvas.height = 500;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw text
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    
    textLines.forEach(line => {
      const x = canvas.width / 2 + (line.horizontalPosition * canvas.width / 100);
      const y = canvas.height * (line.verticalPosition / 100);
      
      // Draw text outline
      ctx.strokeText(line.text, x, y);
      // Draw text fill
      ctx.fillText(line.text, x, y);
    });
  };

  const downloadMeme = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="meme-canvas-container">
      {selectedTemplate || customImage ? (
        <div>
          <canvas ref={canvasRef} className="meme-canvas" />
          <button className="download-btn" onClick={downloadMeme}>
            Download Meme
          </button>
        </div>
      ) : (
        <div className="canvas-placeholder">
          <div className="placeholder-icon">👆</div>
          <p>Select a template or upload your own image to start</p>
        </div>
      )}
    </div>
  );
};

export const TextCustomizer = ({ textLines, setTextLines, fontFamily, setFontFamily, fontSize, setFontSize, textColor, setTextColor }) => {
  const addTextLine = () => {
    const newLine = {
      id: Date.now(),
      text: '',
      verticalPosition: 50,
      horizontalPosition: 50
    };
    setTextLines([...textLines, newLine]);
  };

  const updateTextLine = (id, field, value) => {
    setTextLines(textLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const removeTextLine = (id) => {
    setTextLines(textLines.filter(line => line.id !== id));
  };

  return (
    <div className="text-customizer">
      <h3>Customize Your Meme</h3>
      
      {textLines.map((line, index) => (
        <div key={line.id} className="text-line">
          <div className="text-input-group">
            <label>Text Line {index + 1}</label>
            <input
              type="text"
              value={line.text}
              onChange={(e) => updateTextLine(line.id, 'text', e.target.value)}
              placeholder="Enter text..."
            />
            {textLines.length > 1 && (
              <button 
                className="remove-text-btn"
                onClick={() => removeTextLine(line.id)}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="position-controls">
            <div className="slider-group">
              <label>Vertical Position: {line.verticalPosition}%</label>
              <input
                type="range"
                min="10"
                max="90"
                value={line.verticalPosition}
                onChange={(e) => updateTextLine(line.id, 'verticalPosition', parseInt(e.target.value))}
              />
            </div>
            
            <div className="slider-group">
              <label>Horizontal Position: {line.horizontalPosition}%</label>
              <input
                type="range"
                min="10"
                max="90"
                value={line.horizontalPosition}
                onChange={(e) => updateTextLine(line.id, 'horizontalPosition', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      ))}
      
      <div className="font-controls">
        <div className="control-group">
          <label>Font Family</label>
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            <option value="Impact">Impact</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Font Size: {fontSize}px</label>
          <input
            type="range"
            min="16"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>Text Color</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </div>
      </div>
      
      <button className="add-text-btn" onClick={addTextLine}>
        Add Text Line
      </button>
    </div>
  );
};

export const FileUploader = ({ onImageUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageUpload(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div className="file-uploader">
      <h3>Or Upload Your Own</h3>
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        <p>Choose File - No file chosen</p>
        <small>Or Enter Image URL</small>
        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          onChange={(e) => {
            if (e.target.value) {
              onImageUpload(e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
};

export { MEME_TEMPLATES };