# Monitoring & Observability

## Performance Metrics
- **Scan Duration**: Time from start to completion
- **Repository Size**: Size of scanned repositories
- **Threat Detection Rate**: Percentage of scans finding threats
- **Error Rate**: Percentage of failed scans
- **Memory Usage**: Peak memory consumption per scan

## Health Checks
- **API Endpoint**: `/api/health` for system status
- **Dependency Checks**: Verify npm registry connectivity
- **Git Operations**: Test repository cloning capability
- **Scanner Status**: Verify all threat scanners are functional

## Logging Strategy
- **Structured Logging**: JSON format for machine readability
- **Log Levels**: Error, Warn, Info, Debug
- **Sensitive Data**: No repository content in logs
- **Performance Data**: Scan timing and resource usage
