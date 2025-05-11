import os
import re
import PyPDF2
from bs4 import BeautifulSoup
import requests
from typing import List, Dict, Any, Optional, Tuple
import uuid
from datetime import datetime
import nltk
from nltk.tokenize import sent_tokenize
import asyncio
from app.models.document import Document, DocumentChunk
from app.models.settings import Settings
from langdetect import detect
from pathlib import Path
from tqdm import tqdm

# Download NLTK resources
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class DocumentProcessor:
    """
    Document processor class for processing and chunking documents
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        max_chunks_per_doc: int = 100
    ):
        """
        Initialize document processor
        
        Args:
            chunk_size: Maximum number of characters per chunk
            chunk_overlap: Number of characters to overlap between chunks
            max_chunks_per_doc: Maximum number of chunks per document
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.max_chunks_per_doc = max_chunks_per_doc
        self.settings = Settings()
        
    async def process_document(self, document: Document) -> Tuple[Document, List[DocumentChunk]]:
        """
        Process a document and split it into chunks
        
        Args:
            document: Document to process
            
        Returns:
            Tuple of (updated document, list of document chunks)
        """
        try:
            content = None
            
            # Extract content based on source
            if document.content:
                # Content is already provided
                content = document.content
            elif document.file_path:
                # Extract from file
                content = await self._extract_from_file(document.file_path, document.mime_type)
            elif document.url:
                # Extract from URL
                content = await self._extract_from_url(document.url)
            
            if not content:
                document.error = "Could not extract content from document"
                document.processed = True
                return document, []
                
            # Split into chunks
            chunks = await self._split_into_chunks(content, document.id)
            
            # Update document
            document.processed = True
            document.chunk_count = len(chunks)
            document.updated_at = datetime.now()
            
            return document, chunks
        except Exception as e:
            document.error = str(e)
            document.processed = True
            document.updated_at = datetime.now()
            return document, []
    
    async def _extract_from_file(self, file_path: str, mime_type: Optional[str] = None) -> Optional[str]:
        """
        Extract text content from a file
        
        Args:
            file_path: Path to file
            mime_type: MIME type of file
            
        Returns:
            Extracted text content
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        # Determine file type from extension if mime_type is not provided
        if not mime_type:
            ext = os.path.splitext(file_path)[1].lower()
            if ext == '.pdf':
                mime_type = 'application/pdf'
            elif ext in ['.txt', '.md']:
                mime_type = 'text/plain'
            elif ext in ['.html', '.htm']:
                mime_type = 'text/html'
            elif ext in ['.doc', '.docx']:
                mime_type = 'application/msword'
        
        # Extract based on file type
        if mime_type == 'application/pdf':
            return await self._extract_from_pdf(file_path)
        elif mime_type == 'text/plain':
            return await self._extract_from_text(file_path)
        elif mime_type == 'text/html':
            return await self._extract_from_html_file(file_path)
        else:
            # Default to treating as text
            return await self._extract_from_text(file_path)
    
    async def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    text += page.extract_text() + "\n\n"
            return text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            raise
    
    async def _extract_from_text(self, file_path: str) -> str:
        """Extract text from plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            # Try with another encoding
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read()
    
    async def _extract_from_html_file(self, file_path: str) -> str:
        """Extract text from HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                html = file.read()
            
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
                
            # Get text
            text = soup.get_text()
            
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            
            return text
        except Exception as e:
            print(f"Error extracting text from HTML file: {e}")
            raise
    
    async def _extract_from_url(self, url: str) -> Optional[str]:
        """Extract text from URL"""
        try:
            # Request webpage
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
                
            # Get text
            text = soup.get_text()
            
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            
            return text
        except Exception as e:
            print(f"Error extracting text from URL: {e}")
            raise
    
    async def _split_into_chunks(self, text: str, document_id: str) -> List[DocumentChunk]:
        """
        Split text into chunks
        
        Args:
            text: Text to split
            document_id: ID of the document
            
        Returns:
            List of document chunks
        """
        chunks = []
        
        # Clean text
        text = re.sub(r'\s+', ' ', text).strip()
        
        if not text:
            return chunks
            
        # Try to detect language
        try:
            language = detect(text[:1000])  # Use first 1000 chars for detection
        except:
            language = 'en'  # Default to English
            
        # Split text into sentences
        try:
            sentences = sent_tokenize(text, language=language)
        except:
            # Fallback to simple splitting
            sentences = [s.strip() + '.' for s in re.split(r'[.!?]+', text) if s.strip()]
        
        current_chunk = ""
        current_chunk_size = 0
        chunk_index = 0
        
        for sentence in sentences:
            # If adding this sentence would exceed chunk size, create a new chunk
            if current_chunk_size + len(sentence) > self.chunk_size and current_chunk:
                # Create chunk
                chunk = DocumentChunk(
                    document_id=document_id,
                    content=current_chunk,
                    chunk_index=chunk_index
                )
                chunks.append(chunk)
                chunk_index += 1
                
                # Start new chunk with overlap
                words = current_chunk.split()
                overlap_words = words[-min(len(words), self.chunk_overlap // 5):]  # Approx 5 chars per word
                current_chunk = ' '.join(overlap_words) + ' ' + sentence
                current_chunk_size = len(current_chunk)
            else:
                # Add sentence to current chunk
                if current_chunk:
                    current_chunk += ' ' + sentence
                else:
                    current_chunk = sentence
                current_chunk_size = len(current_chunk)
        
        # Add the last chunk if it's not empty
        if current_chunk and chunk_index < self.max_chunks_per_doc:
            chunk = DocumentChunk(
                document_id=document_id,
                content=current_chunk,
                chunk_index=chunk_index
            )
            chunks.append(chunk)
        
        # Limit to max chunks
        if len(chunks) > self.max_chunks_per_doc:
            chunks = chunks[:self.max_chunks_per_doc]
            
        return chunks