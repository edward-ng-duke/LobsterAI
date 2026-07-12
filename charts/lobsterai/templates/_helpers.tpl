{{- define "lobsterai.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "lobsterai.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "lobsterai.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "lobsterai.labels" -}}
app.kubernetes.io/name: {{ include "lobsterai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: lobsterai
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "lobsterai.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lobsterai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "lobsterai.containerSecurityContext" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
runAsNonRoot: true
runAsUser: {{ .Values.security.runAsUser }}
runAsGroup: {{ .Values.security.runAsGroup }}
capabilities:
  drop:
    - ALL
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{- define "lobsterai.podSecurityContext" -}}
runAsNonRoot: true
runAsUser: {{ .Values.security.runAsUser }}
runAsGroup: {{ .Values.security.runAsGroup }}
fsGroup: {{ .Values.security.fsGroup }}
seccompProfile:
  type: RuntimeDefault
{{- end -}}
