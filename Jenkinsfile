pipeline {
    agent any
    environment {
        GIT_CREDENTIALS = credentials('githublocal')
        DOCKERHUB_CREDENTIALS = credentials('dockerhublocal')
    }
    stages {
	    
	    stage('gitclone') {

			steps {
				git branch: 'main', credentialsId: 'githublocal', url: 'https://github.com/piyushak21/finalBetaV2.git'
			}
		}

        stage('Build') {
            steps {
                sh 'npm install'
            }
        }

        stage('Stop and Remove Previous Container') {
            steps {
                sh 'docker stop piyushakotkar/jenkinsnodelocal || true'
                sh 'docker rm piyushakotkar/jenkinsnodelocal || true'
            }
        }

		stage('Docker Build') {

			steps {
				sh 'docker build -t piyushakotkar/jenkinsnodelocal:latest .'
			}
		}

		stage('Login to Docker Hub') {

			steps {
				sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
			}
		}

		stage('Push to Docker Hub') {

			steps {
				sh 'docker push piyushakotkar/jenkinsnodelocal:latest'
			}
		}

        stage('Run Docker Container') {
            steps {
                sh 'docker run -d -p 3001:3001 piyushakotkar/jenkinsnodelocal:latest'
            }
        }
	}

	post {
		always {
			sh 'docker logout'
		}
	}

}