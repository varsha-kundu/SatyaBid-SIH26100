try:
    import pymupdf as fitz  # preferred import for PyMuPDF >= 1.24
except ImportError:
    import fitz  # fallback for older versions
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class DocumentExtractor:

    ENTITY_PATTERNS = {

        "gstin":
        r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]\b",

        "pan":
        r"\b[A-Z]{5}\d{4}[A-Z]\b",

        "udyam":
        r"UDYAM-[A-Z]{2}-\d{2}-\d{7}",

        "cin":
        r"\b[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b",
    }

    def extract_text(self, pdf_path):

        try:

            pdf = fitz.open(pdf_path)

            text = ""

            for page in pdf:
                text += page.get_text()

            return text

        except Exception as e:

            logger.exception(
                "PDF extraction failed"
            )

            raise RuntimeError(
                f"Unable to read PDF: {e}"
            )

    def extract_entities(self, text):

        entities = {}

        for entity, pattern in self.ENTITY_PATTERNS.items():

            matches = re.findall(
                pattern,
                text,
                re.IGNORECASE
            )

            entities[entity] = list(
                set(matches)
            )

        return entities

    def calculate_confidence(self, entities):

        score = 0

        for values in entities.values():

            if len(values):
                score += 25

        return min(score, 100)

    def process_pdf(self, pdf_path):

        text = self.extract_text(
            pdf_path
        )

        entities = self.extract_entities(
            text
        )

        confidence = \
            self.calculate_confidence(
                entities
            )

        return {

            "file_name":
            Path(pdf_path).name,

            "entities":
            entities,

            "confidence":
            confidence,

            "text_length":
            len(text)
        }


extractor = DocumentExtractor()