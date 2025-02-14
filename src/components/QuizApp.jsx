import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Trophy } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import '../index.css';


export default function QuizApp() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [droppedItems, setDroppedItems] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app,fetch from your server
    import('../data/db.json')
      .then(data => {
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load questions:", error);
        setLoading(false);
      });
  }, []);

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (slotId) => {
    if (draggedItem) {
      setDroppedItems(prev => ({
        ...prev,
        [slotId]: draggedItem
      }));
      setDraggedItem(null);
    }
  };

  const handleMultipleChoiceSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!questions.length || loading) return;
    
    const currentQ = questions[currentQuestion];
    setShowFeedback(true);

    if (currentQ.type === 'multiple-choice') {
      if (selectedAnswer === currentQ.correct) {
        setScore(score + 1);
      }
    } else {
      const isCorrect = Object.entries(currentQ.correct).every(
        ([slot, expectedItem]) => droppedItems[slot] === expectedItem
      );
      if (isCorrect) {
        setScore(score + 1);
      }
    }
  };

  const nextQuestion = () => {
    if (currentQuestion <questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setDroppedItems({});
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setDroppedItems({});
    setQuizCompleted(false);
  };

  const renderMultipleChoice = () => {
    const question = questions[currentQuestion];
    return (
      <div className="space-y-4">
        {question.options.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleMultipleChoiceSelect(option.id)}
            className={`w-full p-4 text-left rounded-lg border transition-colors
              ${selectedAnswer === option.id 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-gray-200 hover:border-teal-200'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {option.id}. {option.text}
          </motion.button>
        ))}
      </div>
    );
  };

  const renderDragAndDrop = () => {
    const question = questions[currentQuestion];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {question.slots.map((slot, index) => (
            <div
              key={`slot-${index}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(`slot-${index}`)}
              className={`h-20 rounded-lg border-2 border-dashed p-4 transition-colors
                ${droppedItems[`slot-${index}`] ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}`}
            >
              {droppedItems[`slot-${index}`] ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {question.items.find(item => item.id === droppedItems[`slot-${index}`])?.text}
                </motion.div>
              ) : (
                'Drop here...'
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {question.items.filter(item => !Object.values(droppedItems).includes(item.id)).map((item) => (
            <motion.div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              className="p-3 bg-gray-100 rounded-md cursor-move"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.text}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderFeedback = () => {
    const currentQ = questions[currentQuestion];
    const isCorrect = currentQ.type === 'multiple-choice'
      ? selectedAnswer === currentQ.correct
      : Object.entries(currentQ.correct).every(
          ([slot, expectedItem]) => droppedItems[slot] === expectedItem
        );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className={`mt-4 ${isCorrect ? 'bg-teal-50' : 'bg-amber-50'}`}>
          {isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <AlertDescription className={isCorrect ? 'text-teal-600' : 'text-amber-600'}>
            {isCorrect ? currentQ.feedbackCorrect : currentQ.feedbackIncorrect}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  };

  const renderProgressBar = () => {
    const progress = (currentQuestion / questions.length) * 100;
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-teal-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  const renderSummaryScreen = () => {
    const percentage = (score / questions.length) * 100;
    let message = '';
    
    if (percentage === 100) {
      message = "Perfect score! You're a quiz master!";
    } else if (percentage >= 70) {
      message = "Great job! You've done well!";
    } else if (percentage >= 50) {
      message = 'Good effort! Keep practicing!';
    } else {
      message = "Don't worry! Try again to improve your score!";
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-6"
      >
        <Trophy className="h-24 w-24 mx-auto text-yellow-500" />
        <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
        <div className="text-4xl font-bold text-teal-600">{score} / {questions.length}</div>
        <p className="text-gray-600">{message}</p>
        <Button
          onClick={resetQuiz}
          className="bg-teal-600 hover:bg-teal-700 text-white w-full mt-4"
        >
          Try Again
        </Button>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p>Loading quiz questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          {renderSummaryScreen()}
        </CardContent>
      </Card>
    );
  }

  if (!questions.length) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p>No questions available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto overflow-hidden">
      <CardHeader className="space-y-3">
        {renderProgressBar()}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0 || showFeedback}
            className="bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl font-bold">Question {currentQuestion + 1}</CardTitle>
          <div className="text-sm text-teal-600 font-medium">
            Score: {score}/{questions.length}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg font-medium mb-4">{questions[currentQuestion].question}</p>
            
            {questions[currentQuestion].type === 'multiple-choice' 
              ? renderMultipleChoice() 
              : renderDragAndDrop()}
          </motion.div>
        </AnimatePresence>

        {showFeedback && renderFeedback()}
        
        <div className="flex justify-end space-x-2 mt-6">
          {!showFeedback ? (
            <Button
              onClick={checkAnswer}
              className="bg-purple-800 hover:bg-teal-700 text-white"
              disabled={
                (questions[currentQuestion].type === 'multiple-choice' && selectedAnswer === null) ||
                (questions[currentQuestion].type === 'drag-drop' && 
                 Object.keys(droppedItems).length !== questions[currentQuestion].slots.length)
              }
            >
              Check Answer
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {currentQuestion <questions.length - 1 ? (
                <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
              ) : (
                'View Results'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>  );
}
