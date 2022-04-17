import { useContext } from 'react'
import { Link } from "react-router-dom"
import { Ctx } from './context.jsx'

const Navbar = (params) => {
  const { search_value, set_search_value, viewSearchedStudent, setToken } = useContext(Ctx)
  return (
    <div className="navbar bg-base-100" style={{marginTop: "10px", marginBottom: "10px"}}>
      <div className='navbar-start'>
        <div className="dropdown">
          <label tabIndex="0" className="btn btn-ghost btn-circle lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
          </label>
          <ul tabIndex="0" className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/addstudent">Aggiungi studente</Link></li>
            <li><Link to="/exams">Elenco esami</Link></li>
            <li><Link to="/" onClick={() => { setToken("") }}>Logout</Link></li>
          </ul>
        </div>
        <Link to="/">Logo</Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal p-0">
          <li><Link to="/addstudent">Aggiungi studente</Link></li>
          <li><Link to="/exams">Elenco esami</Link></li>
          <li><Link to="/" onClick={() => { setToken("") }}>Logout</Link></li>
        </ul>
      </div>
      <div className="navbar-end">
        <div className="form-control">
          <div className="input-group">
            <input type="text" placeholder="Cerca studente..." className="input input-bordered" value={search_value} htmlFor="my-modal-4"
              onChange={e => {
                  //TODO: premendo enter riavvia tutto senza motivo
                  //TODO: può capitare che vada fuori sync quando vengono cancellati i valori (ctrl+a, return)
                  //TODO: mostra un cascade menu con tutte i possiibli risultati (se maggiori di uno)
                  // dopo aver selezionato un valore dalla lista viene fatta la sua ricerca
                  set_search_value(e.target.value)
                }
              } 
              onKeyUp={e => {
                  if (event.keyCode === 13) {
                    viewSearchedStudent()
                  }
                }
              }>
            </input>
            <button className="btn modal-button" htmlFor="my-modal-4" 
              onClick={e => {
                  viewSearchedStudent()
                }
              }>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar;
