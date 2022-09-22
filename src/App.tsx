import { useState, useEffect } from 'react'

interface AppDescriptionProps {
  onTakeQuiz: () => void
}

function AppDescription({ onTakeQuiz }: AppDescriptionProps) {
  return (
    <div className="text-center space-y-7">
      <h1 className="font-bold text-3xl">Quiz App</h1>
      <p>
        A simple quiz app powered by <a href="https://opentdb.com/" className="underline">Open Trivia Database</a>.
      </p>
      <button className="bg-sky-700 text-white px-2 py-1 rounded" onClick={onTakeQuiz}>Take quiz</button>
    </div>
  )
}

function Loading() {
  let [dotsCount, setDotsCount] = useState(0)

  useEffect(() => {
    let timeout = setTimeout(() => {
      setDotsCount((dotsCount + 1) % 4)
    }, 1000)
    return () => { clearTimeout(timeout) }
  })

  let text = 'Loading quiz'
  for (let i = 0; i < dotsCount; i++) {
    text += '.'
  }
  return (
    <p className="text-center font-bold text-2xl">{text}</p>
  )
}

interface LoadingErrorProps {
  onTryAgain: () => void
}

function LoadingError({ onTryAgain }: LoadingErrorProps) {
  return (
    <div className="text-center space-y-3">
      <p>We couldn't fetch a quiz.</p>
      <button className="bg-sky-700 text-white px-2 py-1 rounded" onClick={onTryAgain}>Try again</button>
    </div>
  )
}

interface QuizQuestionProps {
  question: Question
  onSelectOption: (choice: number) => void
  index: number
  total: number
}

function QuizQuestion({ question, onSelectOption, index, total }: QuizQuestionProps) {
  return (
    <div className="space-y-3">
      <p className="font-bold text-xl">Question {index + 1}/{total}</p>
      <p><span className="font-bold">Category:</span> {question.category}</p>
      <p><span className="font-bold">Difficulty:</span> {question.difficulty}</p>
      <p>{question.question}</p>
      <div className="divide-y">
      {
        question.options
                .map((option, index) => 
                  <p key={index} className="p-2 hover:cursor-pointer" onClick={() => {onSelectOption(index)}}>{(index + 1) + ') ' + option}</p>
                )
      }
      </div>
    </div>
  )
}

interface QuestionResultProps{
  question: Question
  userOptionIndex: number
  questionIndex: number
}

function QuestionResult({ question, userOptionIndex, questionIndex }: QuestionResultProps) {
  let correctOption
  let incorrectUserOption = null
  if (userOptionIndex === question.correctOptionIndex) {
    correctOption = <p><span className="font-bold">Correct option (Your option):</span> {(userOptionIndex + 1) + ') ' + question.options[userOptionIndex]}</p>
  }
  else {
    correctOption = <p><span className="font-bold">Correct option:</span> {(question.correctOptionIndex + 1) + ') ' + question.options[question.correctOptionIndex]}</p>
    incorrectUserOption = <p><span className="font-bold">Your option:</span> {(userOptionIndex + 1) + ') ' + question.options[userOptionIndex]}</p>
  }
  return (
    <div>
      <p>{(questionIndex + 1) + ') ' + question.question}</p>
      { correctOption }
      { incorrectUserOption }
    </div>
  )
}

interface ResultsProps {
  questions: Question[]
  choices: number[]
  onTakeAnotherQuiz: () => void
}

function Results({ questions, choices, onTakeAnotherQuiz }: ResultsProps) {
  let score = 0
  let questionResults = []
  for (let i = 0; i < questions.length; i++) {
    if (questions[i].correctOptionIndex === choices[i]) {
      score++
    }
    questionResults.push(<QuestionResult key={i} question={questions[i]} userOptionIndex={choices[i]} questionIndex={i}/>)
  }
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <p className="font-bold text-2xl">Results</p>
        <button onClick={onTakeAnotherQuiz} className="bg-sky-700 text-white px-2 py-1 rounded">Take new quiz</button>
      </div>
      <p><span className="font-bold">Score:</span> {score}/{questions.length}</p>
      { questionResults }
    </div>
  )
}

interface QuizProps {
  questions: Question[]
  onTakeAnotherQuiz: () => void
}

function Quiz({ questions, onTakeAnotherQuiz }: QuizProps) {
  let [choices, setChoices] = useState<number[]>([])
  let [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  let [showResult, setShowResult] = useState(false)

  function onSelectOption(choice: number) {
    choices.push(choice)
    if (currentQuestionIndex + 1 === questions.length) {
      setShowResult(true)
    }
    else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  if (showResult) {
    return <Results questions={questions} 
                    choices={choices} 
                    onTakeAnotherQuiz={() => {
                      setChoices([])
                      setCurrentQuestionIndex(0)
                      setShowResult(false)
                      onTakeAnotherQuiz()
                    }}/>
  }
  return <QuizQuestion question={questions[currentQuestionIndex]} 
                        onSelectOption={onSelectOption}
                        index={currentQuestionIndex}
                        total={questions.length}/>
}

enum QuizLoadingState {
  Initial,
  Loading,
  LoadingError,
}

interface Question {
  question: string
  category: string
  difficulty: string
  options: string[]
  correctOptionIndex: number
}

//https://stackoverflow.com/a/34064434
//https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
function cleanHTMLString(text: string): string {
  let parser = new DOMParser()
  let cleanedText = parser.parseFromString(text, "text/html").documentElement.textContent
  if (cleanedText) {
    return cleanedText
  }
  else {
    return text
  }
}

function capitalize(text: string) : string {
  if (text.length === 0) {
    return ""
  }
  return text[0].toUpperCase() + text.slice(1)
}

function shuffle(list: any[]) {
  for (let i = list.length - 1; i > 0; i--) {
    let j = Math.floor((i + 1) * Math.random())
    let temp = list[i]
    list[i] = list[j]
    list[j] = temp
  }
}

function App() {
  let [quizQuestions, setQuizQuestions] = useState<null|Question[]>(null)
  let [quizLoadingState, setQuizLoadingState] = useState(QuizLoadingState.Initial)

  function fetchQuiz() {
    setQuizQuestions(null)
    setQuizLoadingState(QuizLoadingState.Loading)
    fetch('https://opentdb.com/api.php?amount=10&type=multiple')
      .then(res => {
        if (!res.ok) {
          throw new Error('The fetch for the quiz returned a non ok response.')
        }
        return res.json()
      })
      .then(json => {
        let questions: Question[] = []
        json.results.forEach((question: any) => {
          let options: string[] = question.incorrect_answers
          options.push(question.correct_answer)
          shuffle(options)
          questions.push({
            question: cleanHTMLString(question.question),
            category: question.category,
            difficulty: capitalize(question.difficulty),
            options: options.map(cleanHTMLString),
            correctOptionIndex: options.findIndex(option => option === question.correct_answer)
          })
        })
        setQuizQuestions(questions)
      })
      .catch(err => {
        setQuizLoadingState(QuizLoadingState.LoadingError)
      })
  }

  let innerComponent;
  if (quizQuestions !== null) {
    innerComponent = <Quiz questions={quizQuestions} onTakeAnotherQuiz={fetchQuiz}/>
  }
  else {
    switch (quizLoadingState) {
      case QuizLoadingState.Initial: {
        innerComponent = <AppDescription onTakeQuiz={fetchQuiz}/>
        break
      }
      case QuizLoadingState.Loading: {
        innerComponent = <Loading />
        break
      }
      case QuizLoadingState.LoadingError: {
        innerComponent = <LoadingError onTryAgain={fetchQuiz}/>
        break
      }
    }
  }

  return (
    <div className="p-5 max-w-lg mx-auto">
      {innerComponent}
    </div>
  )
}

export default App
