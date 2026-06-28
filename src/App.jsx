import MultiStepForm from './components/MultiStepForm'
import { our_office_name, our_broker_name } from './config/company.js'

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 py-1 px-4 sm:px-6">
        <div className="container mx-auto max-w-3xl">
          <header className="brand-header text-center py-3 mb-4">
            <img
              className="brand-logo"
              src="https://daike.eu/c/assets/logo.jpg"
              alt={`${our_office_name} — ${our_broker_name}`}
            />
            <hr className="brand-sep" />
            <div className="calc-badge">
              <span className="calc-badge__title">Защита</span>
              <span className="calc-badge__ribbon">без завишение</span>
            </div>
          </header>
          <div className="transition-transform duration-300 ease-in-out hover:scale-[1.01]">
            <MultiStepForm />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App