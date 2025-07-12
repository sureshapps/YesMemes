import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

export const MemeCanvas = ({ 
  selectedTemplate, 
  customImage, 
  textLines, 
  fontFamily, 
  fontSize, 
  textColor,
  onMemeCreated 
}) => {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdMemeUrl, setCreatedMemeUrl] = useState(null);

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
      if (line.text.trim()) {
        const x = canvas.width / 2 + ((line.horizontalPosition - 50) * canvas.width / 100);
        const y = canvas.height * (line.verticalPosition / 100);
        
        // Draw text outline
        ctx.strokeText(line.text, x, y);
        // Draw text fill
        ctx.fillText(line.text, x, y);
      }
    });
  };

  const createMemeWithAPI = async () => {
    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }

    setIsCreating(true);
    
    try {
      const boxes = textLines
        .filter(line => line.text.trim())
        .map(line => ({
          text: line.text,
          x: line.horizontalPosition,
          y: line.verticalPosition,
          width: 200,
          height: 50,
          color: textColor,
          outline_color: "#000000"
        }));

      const response = await axios.post(`${API}/memes/create`, {
        template_id: selectedTemplate.id,
        boxes: boxes,
        font_family: fontFamily,
        font_size: fontSize
      });

      if (response.data.success) {
        setCreatedMemeUrl(response.data.data.url);
        onMemeCreated && onMemeCreated(response.data.data);
      } else {
        alert(response.data.error_message || 'Failed to create meme');
      }
    } catch (error) {
      console.error('Error creating meme:', error);
      alert('Error creating meme: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  const downloadMeme = () => {
    if (createdMemeUrl) {
      // Download the API-generated meme
      const link = document.createElement('a');
      link.href = createdMemeUrl;
      link.download = 'meme.jpg';
      link.target = '_blank';
      link.click();
    } else {
      // Download the canvas version
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      link.download = 'meme.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="meme-canvas-container">
      {selectedTemplate || customImage ? (
        <div>
          <div className="canvas-section">
            <h3>Preview</h3>
            <canvas ref={canvasRef} className="meme-canvas" />
          </div>
          
          {createdMemeUrl && (
            <div className="generated-meme-section">
              <h3>Generated Meme</h3>
              <img src={createdMemeUrl} alt="Generated meme" className="generated-meme" />
            </div>
          )}
          
          <div className="meme-actions">
            <button 
              className="create-meme-btn" 
              onClick={createMemeWithAPI}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Meme with API'}
            </button>
            <button className="download-btn" onClick={downloadMeme}>
              Download Meme
            </button>
          </div>
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

export const TextCustomizer = ({ 
  textLines, 
  setTextLines, 
  fontFamily, 
  setFontFamily, 
  fontSize, 
  setFontSize, 
  textColor, 
  setTextColor 
}) => {
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
  const [uploading, setUploading] = useState(false);
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

  const handleFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        onImageUpload(response.data.data.url);
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    const url = e.target.url.value.trim();
    if (url) {
      onImageUpload(url);
      e.target.url.value = '';
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
        <p>{uploading ? 'Uploading...' : 'Choose File - No file chosen'}</p>
      </div>
      
      <form onSubmit={handleUrlSubmit} className="url-form">
        <small>Or Enter Image URL</small>
        <input
          type="url"
          name="url"
          placeholder="https://example.com/image.jpg"
          className="url-input"
        />
        <button type="submit" className="url-submit-btn">Use URL</button>
      </form>
    </div>
  );
};

export const UserMemes = ({ onMemeSelect }) => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserMemes();
  }, []);

  const loadUserMemes = async () => {
    try {
      const response = await axios.get(`${API}/memes`);
      if (response.data.success) {
        setMemes(response.data.data);
      }
    } catch (error) {
      console.error('Error loading user memes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMeme = async (memeId) => {
    if (!window.confirm('Are you sure you want to delete this meme?')) return;
    
    try {
      await axios.delete(`${API}/memes/${memeId}`);
      setMemes(memes.filter(meme => meme.id !== memeId));
    } catch (error) {
      console.error('Error deleting meme:', error);
      alert('Error deleting meme');
    }
  };

  if (loading) {
    return <div className="loading">Loading your memes...</div>;
  }

  return (
    <div className="user-memes">
      <h3>Your Created Memes</h3>
      {memes.length === 0 ? (
        <p>No memes created yet. Create your first meme!</p>
      ) : (
        <div className="memes-grid">
          {memes.map(meme => (
            <div key={meme.id} className="meme-item">
              <img src={meme.url} alt="Created meme" />
              <div className="meme-actions">
                <button 
                  className="use-meme-btn"
                  onClick={() => onMemeSelect(meme)}
                >
                  Use Template
                </button>
                <button 
                  className="delete-meme-btn"
                  onClick={() => deleteMeme(meme.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TemplateLoader = ({ onTemplatesLoaded }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API}/memes/templates`);
      if (response.data.success) {
        onTemplatesLoaded(response.data.data);
      } else {
        setError('Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading meme templates...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return null;
};