import { useContext } from 'react'
import { Ctx } from './context.jsx'

const Home = (params) => {
    return (
        <div className="hero min-h-screen">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold">Buongiorno prof. *cognome*</h1>
                <p className="py-6">Attività di oggi:</p>
                <ul>
                    <li className="">esame teoria, ore 9.30</li>
                    <li className="">esame programmazione, ore 15.00</li>
                </ul>
                {/* <button className="btn btn-primary">Get Started</button> */}
              </div>
            </div>
        </div>
    )
}

export default Home;