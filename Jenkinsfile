node {
  def clusters = [
    "playground": "play-eth-sync-sidechain",
    "staging": "stag-eth-sync-sidechain",
    "production": "prod-eth-sync-sidechain"
  ]
  def repository = "props-eth-sync"

  // The name of the service
  def serviceName = "props-eth-sync"

  // The active deployments on kubernetes
  def deployments = ["api"]

  def error = null
  def environment = null

  try {
    timeout(120) {
      cloneRepository()
      setupEnvironment(repository)

      if (isMasterBranch()) {
        environment = "production"
        if (isLastCommitFixingIssue()) {
          announceFlow("Emergency flow, targeting ${environment}")
          installDependencies()
          buildReport()
          publishReport()
          deployServices(serviceName, environment, clusters[environment], deployments)
          slackSend color: 'good', message: "@${env.AUTHOR} → *${env.SLACK_NAME}* was deployed to *${environment}*."
        } else {
          announceFlow("Full flow, targeting ${environment}")
          installDependencies()
          buildReport()
          publishReport()
          deployServices(serviceName, environment, clusters[environment], deployments)
          slackSend color: 'good', message: "@${env.AUTHOR} → *${env.SLACK_NAME}* was deployed to *${environment}*."
        }
      } else {
        environment = getEnvironment()
        if (isCurrentBranchFixingIssue()) {
          announceFlow("Emergency flow, targeting ${environment}")
          installDependencies()
          buildReport()
          publishReport()
          deployServices(serviceName, environment, clusters[environment], deployments)
          slackSend color: 'good', message: "@${env.AUTHOR} → *${env.SLACK_NAME}* was deployed to *${environment}*."
        } else {
          announceFlow("Full flow, targeting ${environment}")
          installDependencies()
          buildReport()
          publishReport()
          deployServices(serviceName, environment, clusters[environment], deployments)
          slackSend color: 'good', message: "@${env.AUTHOR} → *${env.SLACK_NAME}* was deployed to *${environment}*."
        }
      }
      currentBuild.result = "SUCCESS"
    }
  } catch (e) {
    error = e
    stage('Notifying failure') {
      currentBuild.result = "FAILURE"
      slackSend color: 'danger', message: "@${env.AUTHOR} → *${env.SLACK_NAME}* failed.\nDetails here: ${e}\n${env.BlUE_OCEAN_URL}."
    }
  } finally {
    cleanArtifacts()
    if (error) {
      throw error
    }
  }
}

def setupEnvironment(repository) {
  def node = tool name: 'node-8', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
  env.PATH = "${node}/bin:${env.PATH}"
  env.SLACK_NAME = "${repository}:${env.BRANCH_NAME}"
  env.REPOSITORY = "${repository}"
  env.JOB_SHORT_NAME = env.JOB_NAME.replaceFirst(/YouNow\/${repository}\//, "")
  env.BlUE_OCEAN_URL = "${env.JENKINS_URL}blue/organizations/jenkins/YouNow%2F${repository}/detail/${env.JOB_SHORT_NAME}/${env.BUILD_NUMBER}/pipeline"
  env.AUTHOR = sh(
    script: "git --no-pager show -s --format='%an' HEAD",
    returnStdout: true
  ).trim().split(' ')[0].toLowerCase()
}

def deployServices(serviceName, environment, cluster, deployments) {
  def stepsForParallel = [:]

  def stepName = "Deploying ${serviceName}"
  stepsForParallel[stepName] = {
    buildImage(serviceName, environment)
    pushImage(serviceName, environment)
    deployImage(serviceName, environment, cluster, deployments)
  }

  return stage('Deploying Services') {
    parallel stepsForParallel
  }
}

def cloneRepository() {
  return stage('Cloning Repository') {
    checkout scm
  }
}

def isMasterBranch() {
  return env.BRANCH_NAME == 'master'
}

def getEnvironment() {
  if (env.BRANCH_NAME == 'playground') {
    return "playground"
  }

  return "staging"
}

def isCurrentBranchFixingIssue() {
  return env.BRANCH_NAME.startsWith('fix/')
}

def isLastCommitFixingIssue() {
  def lastCommit = sh (script: "git log -1 | grep 'fix/'", returnStatus: true)
  return lastCommit == 1
}

def announceFlow(flow) {
  return stage('Computing Flow') {
    echo "Selected Flow: ${flow}"
    slackSend color: 'good', message: "@${env.AUTHOR} → processing *${env.SLACK_NAME}*. ${flow}.\n${env.BlUE_OCEAN_URL}."
  }
}

def installDependencies() {
  return stage('Fetching Dependencies') {
    sh 'yarn install'
  }
}

def mergeInto(branch) {
  return stage("Merging into ${branch}") {
    sh 'git checkout staging'
    sh "git merge ${env.BRANCH_NAME}"
    sh "git push"
  }
}

def buildReport() {
  return stage('Building Report') {
    parallel "Checking tests": {
      try {
        sh 'npm run test'
      } catch (e) {
      } finally {
      }
    }, "Checking code quality": {
      try {
        sh 'npm run linter'
      } catch (e) {
      } finally {
      }
    }, "Checking test coverage": {
      sh 'npm run cover'
    }, "Transpiling to Plain Old Javascript": {
      sh 'npm run transpile'
    }, "Generating Documentation": {
      sh 'npm run doc'
    }, failFast: true|false
  }
}

def publishReport() {
  return stage('Publishing Report') {
    // publishHTML target: [
    //   allowMissing: false,
    //   alwaysLinkToLastBuild: false,
    //   keepAll: true,
    //   reportDir: 'reports',
    //   reportFiles: 'linter.html',
    //   reportName: 'Linter Report'
    // ]
    // publishHTML target: [
    //   allowMissing: false,
    //   alwaysLinkToLastBuild: false,
    //   keepAll: true,
    //   reportDir: 'coverage/lcov-report',
    //   reportFiles: 'index.html',
    //   reportName: 'Coverage Report'
    // ]
  }
}

def buildImage(service, environment) {
  return stage('Building Image') {
    def localTag = "${env.BUILD_NUMBER}"
    def repo = "${service}-${environment}-sidechain"
    sh "docker build -t ${repo}:${localTag} ."
  }
}

def pushImage(service, environment) {
  return stage("Pushing Image to ${environment}") {
    def localTag = "${env.BUILD_NUMBER}"
    def remoteTag = "${env.BUILD_NUMBER}"
    def repo = "${service}-${environment}-sidechain"
    sh "docker tag ${repo}:${localTag} ${service}:latest"
    sh "docker tag ${repo}:${localTag} 774122189772.dkr.ecr.us-east-1.amazonaws.com/${repo}:${remoteTag}"
    sh "docker tag ${repo}:${localTag} 774122189772.dkr.ecr.us-east-1.amazonaws.com/${repo}:latest"
    sh 'eval $(aws ecr get-login --region us-east-1 --no-include-email)'
    sh "docker push 774122189772.dkr.ecr.us-east-1.amazonaws.com/${repo}:${remoteTag}"
    sh "docker push 774122189772.dkr.ecr.us-east-1.amazonaws.com/${repo}:latest"

    if (environment == 'production') {
        sh "docker tag ${repo}:${localTag} propsprojectservices/props-ethsync:latest"
        withDockerRegistry([ credentialsId: "6544de7e-17a4-4576-9b9b-e86bc1e4f903", url: "" ]) {
          sh "docker push propsprojectservices/props-ethsync:latest"
        }
    } else {
        sh "docker tag ${repo}:${localTag} propsprojectservices/props-ethsync:${environment}"
        withDockerRegistry([ credentialsId: "dockerhub", url: "" ]) {
          sh "docker push propsprojectservices/props-ethsync:${environment}"
        }
    }
  }
}

def deployImage(serviceName, environment, cluster, deployments) {
  return stage("Deploying Image to ${environment}") {
      def initialTag = "latest"
      def newTag = "${env.BUILD_NUMBER}"
      def repo = "${serviceName}-${environment}-sidechain"

      for (int i = 0; i < deployments.size(); i++) {
        def deployment = deployments[i]
        sh "kubectl --kubeconfig=/var/lib/jenkins/kubeconfig set image cronjob/props-submit-rewards submit-rewards=774122189772.dkr.ecr.us-east-1.amazonaws.com/${repo}:${env.BUILD_NUMBER}"
        sh "kubectl --kubeconfig=/var/lib/jenkins/kubeconfig set image cronjob/props-sync-transfers sync-transfers=774122189772.dkr.ecr.us-east-1.amazonaws.com/${repo}:${env.BUILD_NUMBER}"
        sh "kubectl --kubeconfig=/var/lib/jenkins/kubeconfig set image cronjob/state-delta-catchup state-delta-catchup=774122189772.dkr.ecr.us-east-1.amazonaws.com/${repo}:${env.BUILD_NUMBER}"
        // sh "kubectl --kubeconfig=/var/lib/jenkins/kubeconfig set image deployment/${serviceName}-${deployment} ${serviceName}-${deployment}=774122189772.dkr.ecr.us-east-1.amazonaws.com/${repo}:${env.BUILD_NUMBER}"
      }
  }
}

def waitForValidation() {
  return stage('Waiting for Validation') {
    def userInput = input(
      id: 'userInput',
      message: 'Deploy to Production?',
      parameters: [[
        $class: 'TextParameterDefinition',
        defaultValue: '',
        description: 'Note/Comment',
        name: 'shouldDeployToProduction'
      ]]
    )
    echo ("Env: "+userInput)
  }
}

def cleanArtifacts() {
  return stage('Cleaning Artifacts') {
    // Delete current workspace
    sh('rm -rf *')

    // Clean all the previous images but the latest, to keep a cache
    try {
      sh "docker images -q -a | grep -vE \"\$(docker images -a | grep \".*latest\" | awk \"{print \$3}\")\" | xargs docker rmi -f"
    } catch (e) {
    } finally {
    }
  }
}
