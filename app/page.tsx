import Game2048Tetris from "@/components/game-2048-tetris"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <h1 className="text-4xl font-bold mb-8 text-center">2048 Tetris</h1>
      <Game2048Tetris />
    </main>
  )
}

