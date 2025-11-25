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

        /* ================= FRONTEND BUILD ================= */
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

        /* ================= BACKEND INSTALL ================= */
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

        /* ================= DOCKER BUILD ================= */
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

        /* ================= SONAR ANALYSIS ================= */
        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: 'sonar-token-2401125', variable: 'SONAR_TOKEN')]) {
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

        /* ================= NEXUS LOGIN ================= */
        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh '''
                        docker login ${NEXUS} -u admin -p Imcc@2025
                    '''
                }
            }
        }

        /* ================= PUSH IMAGES ================= */
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

        /* ================= K8S DEPLOY ================= */
        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        kubectl apply -f k8s/backend-deployment.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/backend-service.yaml -n ${NAMESPACE}

                        kubectl apply -f k8s/frontend-deployment.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/frontend-service.yaml -n ${NAMESPACE}

                        kubectl rollout status deployment/retrohub-backend -n ${NAMESPACE}
                        kubectl rollout status deployment/retrohub-frontend -n ${NAMESPACE}
                    '''
                }
            }
        }
    }
}
