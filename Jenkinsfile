pipeline {
    agent any
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhublocal')
    }
    stages {
	    
	    stage('gitclone') {

			steps {
				git 'https://github.com/piyushak21/finalBetaV2.git'
			}
		}

		stage('Docker Build') {

			steps {
				sh 'docker build -t piyushakotkar/jenkinsnodelocal:latest .'
			}
		}

		stage('Push to Docker Hub') {

			steps {
				sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
			}
		}

		stage('Push') {

			steps {
				sh 'docker push piyushakotkar/jenkinsnodelocal:latest'
			}
		}
	}

	post {
		always {
			sh 'docker logout'
		}
	}

}