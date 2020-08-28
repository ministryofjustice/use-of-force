{{/* vim: set filetype=mustache: */}}
{{/*
Environment variables for web and worker containers
*/}}
{{- define "deployment.envs" }}
env:
  - name: DB_PASS
    valueFrom:
      secretKeyRef:
        name: dps-rds-instance-output
        key: database_password

  - name: DB_USER
    valueFrom:
      secretKeyRef:
        name: dps-rds-instance-output
        key: database_username

  - name: DB_SERVER
    valueFrom:
      secretKeyRef:
        name: dps-rds-instance-output
        key: rds_instance_address

  - name: DB_NAME
    valueFrom:
      secretKeyRef:
        name: dps-rds-instance-output
        key: database_name

  - name: DB_SSL_ENABLED
    value: "true"

  - name: API_CLIENT_ID
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: API_CLIENT_ID

  - name: API_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: API_CLIENT_SECRET

  - name: SYSTEM_CLIENT_ID
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: SYSTEM_CLIENT_ID

  - name: SYSTEM_CLIENT_SECRET
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: SYSTEM_CLIENT_SECRET

  - name: APPINSIGHTS_INSTRUMENTATIONKEY
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: APPINSIGHTS_INSTRUMENTATIONKEY

  - name: NOTIFY_API_KEY
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: NOTIFY_API_KEY

  - name: TAG_MANAGER_KEY
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: TAG_MANAGER_KEY

  - name: TAG_MANAGER_ENVIRONMENT
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: TAG_MANAGER_ENVIRONMENT

  - name: SESSION_SECRET
    valueFrom:
      secretKeyRef:
        name: {{ template "app.name" . }}
        key: SESSION_SECRET

  - name: NOMIS_AUTH_URL
    value: {{ .Values.env.NOMIS_AUTH_URL | quote }}

  - name: ELITE2API_ENDPOINT_URL
    value: {{ .Values.env.ELITE2_API_URL | quote }}

  - name: PRISONER_SEARCH_ENDPOINT_URL
    value: {{ .Values.env.PRISONER_SEARCH_ENDPOINT_URL | quote }}

  - name: INGRESS_URL
    value: 'https://{{ .Values.ingress.host }}'
  
  - name: EXIT_LOCATION_URL
    value: {{ .Values.env.EXIT_LOCATION_URL | quote }}

  - name: EMAIL_LOCATION_URL
    value: {{ .Values.env.EMAIL_LOCATION_URL | quote }}
    
  - name: TOKENVERIFICATION_API_URL
    value: {{ .Values.env.TOKENVERIFICATION_API_URL | quote }}

  - name: TOKENVERIFICATION_API_ENABLED
    value: {{ .Values.env.TOKENVERIFICATION_API_ENABLED | quote }}

  - name: NODE_ENV	  - name: REDIS_HOST
    valueFrom:
      secretKeyRef:
        name: uof-elasticache-redis
        key: primary_endpoint_address

  - name: REDIS_AUTH_TOKEN
    valueFrom:
      secretKeyRef:
        name: uof-elasticache-redis
        key: auth_token
  
  - name: REDIS_TLS_ENABLED
    value: {{ .Values.env.REDIS_TLS_ENABLED }}
    value: "true"
{{- end -}}
