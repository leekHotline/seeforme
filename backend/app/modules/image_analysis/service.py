"""Image analysis business logic."""

import base64
import logging

import anthropic
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.uploads.service import get_upload_content_path, get_uploaded_file

logger = logging.getLogger(__name__)

_FALLBACK_RESPONSE = {
    "description": "图片描述服务暂时不可用，请稍后重试。",
    "is_clear": True,
    "clarity_note": None,
    "confidence": 0.0,
}


async def describe_image(db: AsyncSession, image_file_id: str, language: str) -> dict:
    """Describe image content for visually impaired users using Claude vision API.

    Falls back to a placeholder when no API key is configured or the file
    cannot be retrieved from storage.
    """
    if not settings.ANTHROPIC_API_KEY:
        return {
            "description": f"[Image description placeholder for file: {image_file_id}]",
            "is_clear": True,
            "clarity_note": None,
            "confidence": 0.0,
        }

    record = await get_uploaded_file(db, image_file_id)
    if record is None:
        return _FALLBACK_RESPONSE

    try:
        file_path = get_upload_content_path(record)
        image_data = file_path.read_bytes()
    except (FileNotFoundError, OSError) as exc:
        logger.warning("Failed to read image file %s: %s", image_file_id, exc)
        return _FALLBACK_RESPONSE

    image_b64 = base64.b64encode(image_data).decode("utf-8")

    if language.startswith("zh"):
        system_prompt = (
            "你是一个专门帮助视觉障碍用户的AI助手。"
            "请用清晰、详细的语言描述图片内容，包括主要对象、颜色、场景和任何重要细节。"
            "如果图片模糊或不清晰，请说明这一点。"
        )
        user_text = "请描述这张图片的内容。"
    else:
        system_prompt = (
            "You are an AI assistant specialized in helping visually impaired users. "
            "Describe the image content clearly and in detail, including main objects, "
            "colors, scene, and any important details. "
            "If the image is blurry or unclear, please note that."
        )
        user_text = "Please describe this image."

    try:
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": record.mime_type,
                                "data": image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": user_text,
                        },
                    ],
                }
            ],
        )

        description = message.content[0].text if message.content else ""
        is_unclear = any(
            word in description.lower()
            for word in ("blurry", "unclear", "模糊", "不清晰", "看不清")
        )
        return {
            "description": description,
            "is_clear": not is_unclear,
            "clarity_note": "图片可能模糊或不清晰" if is_unclear else None,
            "confidence": 0.95,
        }
    except Exception as exc:
        logger.error("Claude API call failed for image %s: %s", image_file_id, exc)
        return _FALLBACK_RESPONSE
