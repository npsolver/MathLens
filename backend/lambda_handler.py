import logging

from mangum import Mangum

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

from app.main import app

handler = Mangum(app, lifespan="off")
