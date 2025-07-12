from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import requests
import httpx
import base64
import io
from PIL import Image, ImageDraw, ImageFont
import tempfile
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Imgflip API Configuration
IMGFLIP_API_BASE = "https://api.imgflip.com"
IMGFLIP_USERNAME = os.environ.get('IMGFLIP_USERNAME', '')
IMGFLIP_PASSWORD = os.environ.get('IMGFLIP_PASSWORD', '')

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class MemeTemplate(BaseModel):
    id: str
    name: str
    url: str
    width: int
    height: int
    box_count: int

class MemeTextBox(BaseModel):
    text: str
    x: int
    y: int
    width: int
    height: int
    color: str = "#ffffff"
    outline_color: str = "#000000"

class CreateMemeRequest(BaseModel):
    template_id: str
    boxes: List[MemeTextBox]
    font_family: str = "Impact"
    font_size: int = 36

class CreateMemeResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error_message: Optional[str] = None

class CustomMemeRequest(BaseModel):
    image_url: str
    text_lines: List[dict]
    font_family: str = "Impact"
    font_size: int = 36
    text_color: str = "#ffffff"

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Meme Generator API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.get("/memes/templates")
async def get_meme_templates():
    """Get popular meme templates from Imgflip API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{IMGFLIP_API_BASE}/get_memes")
            
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch meme templates")
            
        data = response.json()
        
        if not data.get('success'):
            raise HTTPException(status_code=500, detail="Imgflip API returned error")
        
        # Transform the data to match our frontend format
        templates = []
        for meme in data['data']['memes'][:20]:  # Limit to first 20 templates
            template = MemeTemplate(
                id=meme['id'],
                name=meme['name'],
                url=meme['url'],
                width=meme['width'],
                height=meme['height'],
                box_count=meme['box_count']
            )
            templates.append(template)
        
        return {"success": True, "data": templates}
        
    except Exception as e:
        logger.error(f"Error fetching meme templates: {str(e)}")
        # Return fallback templates if API fails
        fallback_templates = [
            {
                "id": "181913649",
                "name": "Drake Hotline Bling",
                "url": "https://i.imgflip.com/30b1gx.jpg",
                "width": 1200,
                "height": 1200,
                "box_count": 2
            },
            {
                "id": "87743020",
                "name": "Two Buttons",
                "url": "https://i.imgflip.com/1g8my4.jpg",
                "width": 600,
                "height": 908,
                "box_count": 3
            },
            {
                "id": "112126428",
                "name": "Distracted Boyfriend",
                "url": "https://i.imgflip.com/1ur9b0.jpg",
                "width": 1200,
                "height": 800,
                "box_count": 3
            },
            {
                "id": "131087935",
                "name": "Running Away Balloon",
                "url": "https://i.imgflip.com/24y43o.jpg",
                "width": 761,
                "height": 1024,
                "box_count": 5
            },
            {
                "id": "124822590",
                "name": "Left Exit 12 Off Ramp",
                "url": "https://i.imgflip.com/22bdq6.jpg",
                "width": 804,
                "height": 767,
                "box_count": 3
            },
            {
                "id": "135256802",
                "name": "Epic Handshake",
                "url": "https://i.imgflip.com/28j0te.jpg",
                "width": 900,
                "height": 645,
                "box_count": 3
            },
            {
                "id": "4087833",
                "name": "Waiting Skeleton",
                "url": "https://i.imgflip.com/2fm6x.jpg",
                "width": 298,
                "height": 403,
                "box_count": 2
            },
            {
                "id": "102156234",
                "name": "Mocking Spongebob",
                "url": "https://i.imgflip.com/1otk96.jpg",
                "width": 502,
                "height": 353,
                "box_count": 2
            },
            {
                "id": "93895088",
                "name": "Expanding Brain",
                "url": "https://i.imgflip.com/1jwhww.jpg",
                "width": 857,
                "height": 1202,
                "box_count": 4
            }
        ]
        
        return {"success": True, "data": fallback_templates}

@api_router.post("/memes/create")
async def create_meme(request: CreateMemeRequest):
    """Create a meme using Imgflip API"""
    try:
        if not IMGFLIP_USERNAME or not IMGFLIP_PASSWORD:
            raise HTTPException(
                status_code=500, 
                detail="Imgflip credentials not configured. Please set IMGFLIP_USERNAME and IMGFLIP_PASSWORD in .env"
            )
        
        # Prepare the data for Imgflip API
        data = {
            'template_id': request.template_id,
            'username': IMGFLIP_USERNAME,
            'password': IMGFLIP_PASSWORD,
        }
        
        # Add text boxes
        for i, box in enumerate(request.boxes):
            data[f'text{i}'] = box.text
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{IMGFLIP_API_BASE}/caption_image",
                data=data
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to create meme")
            
        result = response.json()
        
        if not result.get('success'):
            raise HTTPException(
                status_code=400, 
                detail=result.get('error_message', 'Unknown error from Imgflip API')
            )
        
        # Store the meme in database
        meme_doc = {
            'id': str(uuid.uuid4()),
            'template_id': request.template_id,
            'url': result['data']['url'],
            'page_url': result['data']['page_url'],
            'created_at': datetime.utcnow()
        }
        
        await db.memes.insert_one(meme_doc)
        
        return CreateMemeResponse(
            success=True,
            data=result['data']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating meme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/memes/create-custom")
async def create_custom_meme(request: CustomMemeRequest):
    """Create a custom meme with uploaded image"""
    try:
        # This is a simplified version - in production, you'd want to use image processing libraries
        # For now, return a mock response
        mock_response = {
            "success": True,
            "data": {
                "url": request.image_url,  # In real implementation, this would be the processed image
                "page_url": "#",
                "meme_id": str(uuid.uuid4())
            }
        }
        
        return mock_response
        
    except Exception as e:
        logger.error(f"Error creating custom meme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/memes")
async def get_user_memes():
    """Get user's created memes"""
    try:
        memes = await db.memes.find().sort("created_at", -1).to_list(50)
        
        # Convert ObjectId to string for JSON serialization
        for meme in memes:
            meme['_id'] = str(meme['_id'])
            
        return {"success": True, "data": memes}
        
    except Exception as e:
        logger.error(f"Error fetching user memes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/memes/{meme_id}")
async def delete_meme(meme_id: str):
    """Delete a meme"""
    try:
        result = await db.memes.delete_one({"id": meme_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Meme not found")
            
        return {"success": True, "message": "Meme deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting meme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file"""
    try:
        # Check if file is an image
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
            
        # Read the file content
        contents = await file.read()
        
        # Convert to base64 for easy storage/transmission
        base64_image = base64.b64encode(contents).decode('utf-8')
        data_url = f"data:{file.content_type};base64,{base64_image}"
        
        # Store in database
        upload_doc = {
            'id': str(uuid.uuid4()),
            'filename': file.filename,
            'content_type': file.content_type,
            'data_url': data_url,
            'uploaded_at': datetime.utcnow()
        }
        
        await db.uploads.insert_one(upload_doc)
        
        return {
            "success": True,
            "data": {
                "id": upload_doc['id'],
                "filename": file.filename,
                "url": data_url
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()