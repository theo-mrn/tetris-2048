"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, ArrowDown } from "lucide-react"

// Définition des types
type Cell = number | null
type Board = Cell[][]
type Piece = {
  value: number
  shape: boolean[][]
  x: number
  y: number
}

// Couleurs pour les différentes valeurs de tuiles
const tileColors: Record<number, string> = {
  2: "bg-yellow-100 dark:bg-yellow-900",
  4: "bg-yellow-200 dark:bg-yellow-800",
  8: "bg-orange-200 dark:bg-orange-800",
  16: "bg-orange-300 dark:bg-orange-700",
  32: "bg-red-300 dark:bg-red-700",
  64: "bg-red-400 dark:bg-red-600",
  128: "bg-pink-300 dark:bg-pink-700",
  256: "bg-purple-300 dark:bg-purple-700",
  512: "bg-indigo-300 dark:bg-indigo-700",
  1024: "bg-blue-300 dark:bg-blue-700",
  2048: "bg-green-300 dark:bg-green-700",
  4096: "bg-emerald-300 dark:bg-emerald-700",
}

export default function Game2048Tetris() {
  const ROWS = 8
  const COLS = 8
  const [board, setBoard] = useState<Board>(
    Array(ROWS)
      .fill(null)
      .map(() => Array(COLS).fill(null)),
  )
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [nextPiece, setNextPiece] = useState<Piece | null>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [highestTile, setHighestTile] = useState(0)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // Créer une nouvelle pièce
  const createPiece = useCallback((): Piece => {
    const value = Math.random() < 0.8 ? 2 : 4
    // Forme simple : un seul bloc
    const shape = [[true]]

    return {
      value,
      shape,
      x: Math.floor(Math.random() * COLS),
      y: 0,
    }
  }, [COLS])

  // Initialiser le jeu
  const initGame = useCallback(() => {
    setBoard(
      Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(null)),
    )
    const piece = createPiece()
    setCurrentPiece(piece)
    setNextPiece(createPiece())
    setScore(0)
    setGameOver(false)
    setHighestTile(0)
    setIsPaused(false)
  }, [createPiece, ROWS, COLS])

  // Vérifier si une position est valide pour la pièce actuelle
  const isValidPosition = useCallback(
    (piece: Piece, boardToCheck: Board = board): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardX = piece.x + x
            const boardY = piece.y + y

            // Vérifier les limites du plateau
            if (boardX < 0 || boardX >= COLS || boardY < 0 || boardY >= ROWS || boardToCheck[boardY][boardX] !== null) {
              return false
            }
          }
        }
      }
      return true
    },
    [board, COLS, ROWS],
  )

  // Faire tomber la pièce d'un cran
  const movePieceDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return

    const newPiece = {
      ...currentPiece,
      y: currentPiece.y + 1,
    }

    if (isValidPosition(newPiece)) {
      setCurrentPiece(newPiece)
    } else {
      // La pièce ne peut plus descendre, on la fixe sur le plateau
      const newBoard = [...board]
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y
            const boardX = currentPiece.x + x

            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              newBoard[boardY][boardX] = currentPiece.value

              // Mettre à jour la tuile la plus élevée
              if (currentPiece.value > highestTile) {
                setHighestTile(currentPiece.value)
              }
            }
          }
        }
      }

      setBoard(newBoard)

      // Vérifier les fusions possibles
      checkMerges(newBoard)

      // Vérifier si le jeu est terminé
      if (currentPiece.y <= 0) {
        setGameOver(true)
        return
      }

      // Créer une nouvelle pièce
      setCurrentPiece(nextPiece)
      setNextPiece(createPiece())
    }
  }, [currentPiece, board, isValidPosition, gameOver, isPaused, nextPiece, createPiece, highestTile, ROWS, COLS])

  // Appliquer la gravité pour faire tomber les blocs après les fusions
  const applyGravity = useCallback(
    (boardToCheck: Board): Board => {
      const newBoard = Array(ROWS)
        .fill(null)
        .map(() => Array(COLS).fill(null))

      for (let x = 0; x < COLS; x++) {
        let newY = ROWS - 1

        for (let y = ROWS - 1; y >= 0; y--) {
          if (boardToCheck[y][x] !== null) {
            newBoard[newY][x] = boardToCheck[y][x]
            newY--
          }
        }
      }

      return newBoard
    },
    [COLS, ROWS],
  )

  // Vérifier et effectuer les fusions de blocs
  const checkMerges = useCallback(
    (boardToCheck: Board) => {
      let newBoard = [...boardToCheck]
      let mergeHappened = true // On commence à true pour entrer dans la boucle
      let scoreIncrease = 0

      // Continuer tant qu'il y a des fusions
      while (mergeHappened) {
        mergeHappened = false

        // Vérifier les fusions dans toutes les directions
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            if (newBoard[y][x] !== null) {
              // Vérifier à droite
              if (x < COLS - 1 && newBoard[y][x] === newBoard[y][x + 1]) {
                const newValue = newBoard[y][x]! * 2
                newBoard[y][x] = newValue
                newBoard[y][x + 1] = null
                scoreIncrease += newValue
                mergeHappened = true

                if (newValue > highestTile) {
                  setHighestTile(newValue)
                }
              }

              // Vérifier en bas
              if (y < ROWS - 1 && newBoard[y][x] === newBoard[y + 1][x]) {
                const newValue = newBoard[y][x]! * 2
                newBoard[y][x] = newValue
                newBoard[y + 1][x] = null
                scoreIncrease += newValue
                mergeHappened = true

                if (newValue > highestTile) {
                  setHighestTile(newValue)
                }
              }
            }
          }
        }

        // Appliquer la gravité après chaque série de fusions
        if (mergeHappened) {
          newBoard = applyGravity(newBoard)
        }
      }

      setScore((prev) => prev + scoreIncrease)
      setBoard(newBoard)
    },
    [highestTile, applyGravity, ROWS, COLS, board],
  )

  // Déplacer la pièce horizontalement
  const movePieceHorizontal = useCallback(
    (direction: -1 | 1) => {
      if (!currentPiece || gameOver || isPaused) return

      const newPiece = {
        ...currentPiece,
        x: currentPiece.x + direction,
      }

      if (isValidPosition(newPiece)) {
        setCurrentPiece(newPiece)
      }
    },
    [currentPiece, isValidPosition, gameOver, isPaused],
  )

  // Faire tomber la pièce rapidement
  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return

    let newY = currentPiece.y

    while (true) {
      newY++
      const testPiece = {
        ...currentPiece,
        y: newY,
      }

      if (!isValidPosition(testPiece)) {
        newY--
        break
      }
    }

    setCurrentPiece({
      ...currentPiece,
      y: newY,
    })

    // Forcer la mise à jour immédiate
    movePieceDown()
  }, [currentPiece, isValidPosition, gameOver, isPaused, movePieceDown])

  // Gérer les entrées clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return

      // Empêcher le défilement de la page avec les flèches
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) {
        e.preventDefault()
      }

      switch (e.key) {
        case "ArrowLeft":
          movePieceHorizontal(-1)
          break
        case "ArrowRight":
          movePieceHorizontal(1)
          break
        case "ArrowDown":
          movePieceDown()
          break
        case "ArrowUp":
          // Désactivé car nous n'avons qu'un seul bloc
          break
        case " ":
          dropPiece()
          break
        case "p":
          setIsPaused((prev) => !prev)
          break
        case "r":
          initGame()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [movePieceHorizontal, movePieceDown, dropPiece, gameOver, initGame])

  // Boucle de jeu
  useEffect(() => {
    if (gameOver || isPaused) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
      return
    }

    gameLoopRef.current = setInterval(() => {
      movePieceDown()
    }, 1000)

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [movePieceDown, gameOver, isPaused])

  // Initialiser le jeu au chargement
  useEffect(() => {
    initGame()
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [initGame])

  // Rendu du plateau de jeu
  const renderBoard = () => {
    // Créer une copie du plateau pour y ajouter la pièce actuelle
    const displayBoard = board.map((row) => [...row])

    // Ajouter la pièce actuelle au plateau d'affichage
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y
            const boardX = currentPiece.x + x

            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              displayBoard[boardY][boardX] = currentPiece.value
            }
          }
        }
      }
    }

    return (
      <div className="grid grid-cols-8 gap-1 border-2 border-gray-300 dark:border-gray-700 p-1 bg-gray-200 dark:bg-gray-800">
        {displayBoard.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-gray-800 dark:text-gray-200 ${
                cell ? tileColors[cell] || "bg-gray-400 dark:bg-gray-600" : "bg-gray-300 dark:bg-gray-700"
              }`}
            >
              {cell || ""}
            </div>
          )),
        )}
      </div>
    )
  }

  // Rendu de la prochaine pièce
  const renderNextPiece = () => {
    if (!nextPiece) return null

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Prochaine pièce:</h3>
        <div className="flex justify-center items-center p-2 border-2 border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 w-16 h-16">
          <div
            className={`w-10 h-10 flex items-center justify-center font-bold text-gray-800 dark:text-gray-200 ${
              tileColors[nextPiece.value] || "bg-gray-400 dark:bg-gray-600"
            }`}
          >
            {nextPiece.value}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
      <div className="flex flex-col items-center">
        {renderBoard()}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button variant="outline" size="icon" onClick={() => movePieceHorizontal(-1)} disabled={gameOver || isPaused}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => movePieceDown()} disabled={gameOver || isPaused}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => movePieceHorizontal(1)} disabled={gameOver || isPaused}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center md:items-start">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md w-full">
          <h2 className="text-xl font-bold mb-2">Score: {score}</h2>
          <p className="mb-2">Tuile la plus élevée: {highestTile}</p>
          {renderNextPiece()}

          {gameOver && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
              <p className="font-bold">Game Over!</p>
              <p>Score final: {score}</p>
            </div>
          )}

          <Button className="mt-4 w-full" onClick={initGame}>
            Nouvelle partie
          </Button>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold">Contrôles:</p>
            <ul className="list-disc pl-5">
              <li>Flèches gauche/droite: Déplacer</li>
              <li>Flèche bas: Descendre</li>
              <li>Espace: Chute rapide</li>
              <li>P: Pause</li>
              <li>R: Recommencer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

