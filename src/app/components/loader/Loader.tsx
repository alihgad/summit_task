import React from 'react'
import styles from './styel.module.css'

export default function Loader() {
  return (
    <div className='flex justify-center items-center py-10 h-screen'>
        <span className={styles.loader}></span>
    </div>
  )
}
