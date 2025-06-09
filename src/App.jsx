import MultiStepForm from './components/MultiStepForm'

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="transition-transform duration-300 ease-in-out hover:scale-[1.01]">
            <MultiStepForm />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
