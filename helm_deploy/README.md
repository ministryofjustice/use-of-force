
### Example deploy command
```
helm --namespace use-of-force-dev  --tiller-namespace use-of-force-dev upgrade use-of-force ./use-of-force/ --install --values=values-dev.yaml --values=example-secrets.yaml
```

### Helm init

```
helm init --tiller-namespace use-of-force-dev --service-account tiller --history-max 200
```

### Setup Lets Encrypt cert

```
kubectl -n use-of-force-dev apply -f certificate-dev.yaml
kubectl -n use-of-force-preprod apply -f certificate-preprod.yaml
kubectl -n use-of-force-prod apply -f certificate-prod.yaml
```
