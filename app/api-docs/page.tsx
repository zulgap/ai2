'use client';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

// Removed the module augmentation as it is not allowed for untyped modules.

export default function ApiDocs() {
  return (
    <SwaggerUI url="/openapi.yaml" />
  );
}
