import { useContext } from 'react'
import { Link } from "react-router-dom"
import { Ctx } from './context.jsx'

//TODO: aggiungere l'username dell'utente connesso
const Navbar = (params) => {
  const { search_value, set_search_value, setToken } = useContext(Ctx)
  return (
    <div className="navbar bg-base-100">
      <div className='navbar-start'>
        <div className="dropdown">
          <label tabindex="0" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
          </label>
          <ul tabindex="0" className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/">Aggiungi studente</Link></li>
            <li><Link to="/" className="justify-between">Elenco esami</Link></li>
            <li><Link to="/">Logout</Link></li>
          </ul>
        </div>
        <Link to="/">Home</Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal p-0">
          <li><Link to="/">Aggiungi studente</Link></li>
          <li><Link to="/" className="justify-between">Elenco esami</Link></li>
          <li><Link to="/">Logout</Link></li>
        </ul>
      </div>
      <div className="navbar-end">
        {/* <button className="btn btn-ghost btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button> */}
        <div class="form-control">
          <input type="text" placeholder="Search" class="input input-bordered"></input>
        </div>
      </div>
    </div>
  )
          {/* 
          <ul>
          <li>
            <Link to="/" >
              home
            </Link>
          </li>
          <li>
            <div>
              <form>
                <span></span> {/*search icon*/}{/*
                <input type="search" placeholder="Search"
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
      <div></div>
      <div>
        <ul>
          <li>
            <Link to="/exams" >exams</Link>
          </li>
          <li>
          <Link to="/" onClick={() => { setToken("") }} >
            logout
          </Link>
          </li>
        </ul>
      </div>
    </div> */}
}

export default Navbar;
