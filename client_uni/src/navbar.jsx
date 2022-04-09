import { useContext } from 'react'
import { Link } from "react-router-dom"
import { Ctx } from './context.jsx'

//TODO: aggiungere l'username dell'utente connesso
const Navbar = (params) => {
  const { search_value, set_search_value, setToken } = useContext(Ctx)
  return (
    <nav className="uk-navbar-container" uk-navbar="true">
      <div className="uk-navbar-left">
        <ul className="uk-navbar-nav">
          <li>
            <Link to="/" >
              home
            </Link>
          </li>
          <li>
            <div className="uk-navbar-item">
              <form className="uk-search uk-search-navbar">
                <span uk-search-icon="true"></span>
                <input className="uk-search-input" type="search" placeholder="Search"
                  value={search_value} onChange={e => {
                    //TODO: premendo enter riavvia tutto senza motivo
                    //TODO: può capitare che vada fuori sync quando vengono cancellati i valori (ctrl+a, return)
                    //TODO: mostra un cascade menu con tutte i possiibli risultati (se maggiori di uno)
                    // dopo aver selezionato un valore dalla lista viene fatta la sua ricerca
                    set_search_value(e.target.value)
                  }}></input>
              </form>
            </div>
          </li>
        </ul>
      </div>
      <div className="uk-navbar-center"></div>
      <div className="uk-navbar-right">
        <ul className="uk-navbar-nav">
          <li>
            <Link to="/exams" >exams</Link>
          </li>
          <li>
          <Link className="uk-navbar-nav" to="/" onClick={() => { setToken("") }} >
            logout
          </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar;
