pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:

  - name: node
    image: nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/library/node:18
    command: ['cat']
    tty: true

  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ['cat']
    tty: true

  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['cat']
    tty: true
    env:
    - name: KUBECONFIG
      value: /kube/config
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig

  - name: dind
    image: docker:24-dind
    args: ["--storage-driver=overlay2"]
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""

  volumes:
    - name: kubeconfig-secret
      secret:
        secretName: kubeconfig-secret
'''
        }
    }

    environment {
        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        PROJECT_FOLDER = "2401125"
        NAMESPACE = "2401125"

        BACKEND_IMAGE = "${REGISTRY}/${PROJECT_FOLDER}/retrohub-backend"
        FRONTEND_IMAGE = "${REGISTRY}/${PROJECT_FOLDER}/retrohub-frontend"
        TAG = "v1"
    }

    stages {

        stage('Install + Build Frontend') {
            steps {
                container('node') {
                    sh '''
                        cd retrohub-frontend
                        npm install
                        npm run build
                    '''
                }
            }
        }

        stage('Backend Install') {
            steps {
                container('node') {
                    sh '''
                        cd retrohub-backend
                        npm install --omit=dev
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                container('dind') {
                    sh '''
                        docker build --pull=false -t ${BACKEND_IMAGE}:${TAG} ./retrohub-backend
                        docker build --pull=false -t ${FRONTEND_IMAGE}:${TAG} ./retrohub-frontend
                    '''
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh '''
                        echo "Changeme@2025" | docker login ${REGISTRY} -u admin --password-stdin
                    '''
                }
            }
        }

        stage('Push Images to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        docker push ${BACKEND_IMAGE}:${TAG}
                        docker push ${FRONTEND_IMAGE}:${TAG}
                    '''
                }
            }
        }

        stage('Create Namespace If Not Exists') {
            steps {
                container('kubectl') {
                    sh '''
                        kubectl get ns ${NAMESPACE} || kubectl create namespace ${NAMESPACE}
                    '''
                }
            }
        }

        stage('Create ImagePullSecret If Not Exists') {
            steps {
                container('kubectl') {
                    sh '''
                        if ! kubectl get secret nexus-creds -n ${NAMESPACE}; then
                          kubectl create secret docker-registry nexus-creds \
                            --docker-server=${REGISTRY} \
                            --docker-username=admin \
                            --docker-password=Changeme@2025 \
                            -n ${NAMESPACE}
                        fi
                    '''
                }
            }
        }

        stage('Patch Deployments With ImagePullSecret') {
            steps {
                container('kubectl') {
                    sh '''
                        kubectl patch deployment retrohub-backend -n ${NAMESPACE} \
                          -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"nexus-creds"}]}}}}'

                        kubectl patch deployment retrohub-frontend -n ${NAMESPACE} \
                          -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"nexus-creds"}]}}}}'
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE}

                        kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE}

                        kubectl rollout status deployment/retrohub-backend -n ${NAMESPACE} || true
                        kubectl rollout status deployment/retrohub-frontend -n ${NAMESPACE} || true
                    '''
                }
            }
        }
    }
}
