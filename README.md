# AEM Status

Status page and incident tracking for AEM Edge Delivery Services.

## Installation

```bash
npm install
```

## Development

### Local Development Server

To run the status page locally with live reload:

```bash
npm start
```

This will start a development server on `http://localhost:2999` and automatically open your browser. The server watches for file changes and reloads the page automatically.

### Testing

Run tests:

```bash
npm test
```

Watch mode for tests:

```bash
npm run test:watch
```

### Linting

Run linters:

```bash
npm run lint
```

Lint JavaScript:

```bash
npm run lint:js
```

Lint CSS:

```bash
npm run lint:css
```

### Updating Incidents

To update the incidents index from HTML files:

```bash
npm run update-incidents
```

## License

Apache-2.0
