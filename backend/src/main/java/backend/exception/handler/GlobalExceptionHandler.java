package backend.exception.handler;

import backend.exception.BadRequestException;
import backend.exception.ConflictException;
import backend.exception.NotFoundException;
import backend.exception.TooManyRequestsException;
import backend.exception.UnauthorizedException;
import backend.exception.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException e) {
    logger.error("Internal Server Error", e);
    return ResponseEntity.status(500).body(new ErrorResponse("INTERNAL_SERVER_ERROR"));
  }

  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException e) {
    logger.warn("BadRequest: {}", e.getMessage());
    return ResponseEntity.status(400).body(new ErrorResponse("BAD_REQUEST"));
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException e) {
    logger.warn("Unauthorized: {}", e.getMessage());
    return ResponseEntity.status(401).body(new ErrorResponse("UNAUTHORIZED"));
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException e) {
    logger.warn("Not found: {}", e.getMessage());
    return ResponseEntity.status(404).body(new ErrorResponse("NOT_FOUND"));
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<ErrorResponse> handleConflictException(ConflictException e) {
    logger.warn("Conflict: {}", e.getMessage());
    return ResponseEntity.status(409).body(new ErrorResponse("CONFLICT"));
  }

  @ExceptionHandler(TooManyRequestsException.class)
  public ResponseEntity<ErrorResponse> handleTooManyRequestsException(TooManyRequestsException e) {
    logger.warn("Too many requests: {}", e.getMessage());
    return ResponseEntity.status(429).body(new ErrorResponse("TOO_MANY_REQUESTS"));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnknown(Exception e) {
    logger.error("Unhandled exception", e);
    return ResponseEntity.status(500).body(new ErrorResponse("INTERNAL_ERROR"));
  }
}
