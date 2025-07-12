import React, { useState } from 'react';
import './App.css';
import { MemeTemplate, MemeCanvas, TextCustomizer, FileUploader, MEME_TEMPLATES } from './components';

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customImage, setCustomImage] = useState(null);
  const [textLines, setTextLines] = useState([
    { id: 1, text: '', verticalPosition: 20, horizontalPosition: 50 },
    { id: 2, text: '', verticalPosition: 80, horizontalPosition: 50 }
  ]);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#ffffff');
  const [showMoreTemplates, setShowMoreTemplates] = useState(false);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCustomImage(null);
  };

  const handleImageUpload = (imageUrl) => {
    setCustomImage(imageUrl);
    setSelectedTemplate(null);
  };

  const displayedTemplates = showMoreTemplates ? MEME_TEMPLATES : MEME_TEMPLATES.slice(0, 9);

  return (
    <div className="App">
      <header className="app-header">
        <h1>MEME GENERATOR</h1>
      </header>
      
      <div className="main-content">
        <div className="left-panel">
          <div className="templates-section">
            <h2>Popular Meme Templates</h2>
            <div className="templates-grid">
              {displayedTemplates.map(template => (
                <MemeTemplate
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                  selected={selectedTemplate?.id === template.id}
                />
              ))}
            </div>
            {!showMoreTemplates && (
              <button 
                className="load-more-btn"
                onClick={() => setShowMoreTemplates(true)}
              >
                Load More Templates
              </button>
            )}
          </div>

          <FileUploader onImageUpload={handleImageUpload} />

          <TextCustomizer
            textLines={textLines}
            setTextLines={setTextLines}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            textColor={textColor}
            setTextColor={setTextColor}
          />
        </div>

        <div className="right-panel">
          <MemeCanvas
            selectedTemplate={selectedTemplate}
            customImage={customImage}
            textLines={textLines}
            fontFamily={fontFamily}
            fontSize={fontSize}
            textColor={textColor}
          />
        </div>
      </div>
    </div>
  );
}

export default App;