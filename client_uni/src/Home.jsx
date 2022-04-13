import { useContext } from 'react'
import { Ctx } from './context.jsx'

const Home = (params) => {
    return (
        <section style={{display: "flex", margin: "20%", justifyContent: "center", alignItems: "center"}}>
                {/* TODO: tailwindcss/typography per usare <h1> */}
                {/* TODO: inserire cognome professore e controllo eventi del giorno 
                    (es. Buongiorno prof. Bugatti, oggi ci sarà un esame di teoria alle 9.30) */}
                <h1>Buongiorno prof.</h1>
        </section>
    )
}

export default Home;