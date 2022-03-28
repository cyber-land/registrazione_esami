import { useContext } from 'react'
import { Link } from "react-router-dom"
import { Ctx } from './context.jsx'

const Navbar = (params) => {
  const { identificationNumber, setIdentificationNumber } = useContext(Ctx)
  return (
    <nav className="uk-navbar-container" uk-navbar="true">
      <div className="uk-navbar-left">
        <div className="uk-navbar-item">
          <form className="uk-search uk-search-navbar">
            <span uk-search-icon="true"></span>
            <input className="uk-search-input" type="search" placeholder="Search"
              value={identificationNumber} onChange={e => {
                //TODO: premendo enter riavvia tutto senza motivo
                //TODO: può capitare che vada fuori sync quando vengono cancellati i valori (ctrl+a, return)
                setIdentificationNumber(e.target.value)
              }}></input>
          </form>
        </div>
      </div>
      <div className="uk-navbar-center"></div>
      <div className="uk-navbar-right">
        <div className="uk-inline">
          <Link className="uk-navbar-nav" to="/exams" >exams</Link>
          <div className="uk-navbar-dropdown" uk-drop="pos: bottom-center; delay-hide: 0">
            <div className="uk-nav uk-navbar-dropdown-nav">
              create a new exam
            </div>
          </div>
        </div>
        <div className="uk-inline">
          <Link className="uk-navbar-item uk-logo" to="/login" ><span uk-icon="sign-in"></span></Link>
          <div className="uk-navbar-dropdown" uk-drop="pos: bottom-center; delay-hide: 0">
            <div className="uk-nav uk-navbar-dropdown-nav">
              login for teachers
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar;
