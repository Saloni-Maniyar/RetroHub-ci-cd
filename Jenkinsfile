pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:

  - name: node
    image: node:18
    command: ['cat']
    tty: true

  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ['cat']
    tty: true

  - name: kubectl
    image: lachlanevenson/k8s-kubectl
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
    image: docker:dind
    args: ["--storage-driver=overlay2",
           "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"]
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
        BACKEND_IMG = "retrohub-backend"
        FRONTEND_IMG = "retrohub-frontend"
        NEXUS = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        PROJECT_FOLDER = "2401125"
        NAMESPACE = "2401125"
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
                        npm install
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                container('dind') {
                    sh '''
                        sleep 10

                        docker build -t ${BACKEND_IMG}:latest ./retrohub-backend
                        docker build -t ${FRONTEND_IMG}:latest ./retrohub-frontend
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: 'sonar-token-2401125-new', variable: 'SONAR_TOKEN')]) {
                        sh """
                            sonar-scanner \
                                -Dsonar.projectKey=2401125_RetroHub \
                                -Dsonar.sources=retrohub-backend \
                                -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                                -Dsonar.login=$SONAR_TOKEN
                        """
                    }
                }
            }
        }

        /* 🔍 DEBUG NEXUS SERVICE HERE */
        stage('Debug Nexus Service') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "=== NEXUS SERVICES (all namespaces) ==="
                        kubectl get svc -A | grep -i nexus || true

                        echo "=== NEXUS PODS ==="
                        kubectl get pods -A | grep -i nexus || true

                        echo "=== NEXUS NAMESPACES ==="
                        kubectl get ns | grep -i nexus || true
                    '''
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh '''
                        docker login ${NEXUS} -u admin -p Changeme@2025
                    '''
                }
            }
        }

        stage('Push Images to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        docker tag ${BACKEND_IMG}:latest ${NEXUS}/${PROJECT_FOLDER}/${BACKEND_IMG}:v1
                        docker tag ${FRONTEND_IMG}:latest ${NEXUS}/${PROJECT_FOLDER}/${FRONTEND_IMG}:v1

                        docker push ${NEXUS}/${PROJECT_FOLDER}/${BACKEND_IMG}:v1
                        docker push ${NEXUS}/${PROJECT_FOLDER}/${FRONTEND_IMG}:v1
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
                              --docker-server=${NEXUS} \
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

    post {
        always {
            container('kubectl') {
                sh '''
                    echo "=== PODS ==="
                    kubectl get pods -n ${NAMESPACE}

                    POD=$(kubectl get pods -n ${NAMESPACE} | grep retrohub-backend | awk '{print $1}')
                    echo "Backend Pod: $POD"

                    echo "=== BACKEND LOGS ==="
                    kubectl logs $POD -n ${NAMESPACE} || true

                    echo "=== POD DESCRIBE ==="
                    kubectl describe pod $POD -n ${NAMESPACE} || true
                '''
            }
        }
    }
}
