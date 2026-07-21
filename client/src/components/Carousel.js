import React, { useState, useEffect, useRef } from 'react';
import './Carousel.css';

const Carousel = ({ items }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const timerRef = useRef(null);

    // Mínima distancia para considerar un "swipe"
    const minSwipeDistance = 50;

    // --- LÓGICA DE NAVEGACIÓN ---
    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    // --- AUTOPLAY (Parte 3.4) ---
    useEffect(() => {
        timerRef.current = setInterval(nextSlide, 5000);
        return () => clearInterval(timerRef.current);
    }, [currentIndex]); // Se reinicia el timer cada vez que cambia el slide

    // --- SOPORTE TÁCTIL (Touch Events) ---
    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) nextSlide();
        if (isRightSwipe) prevSlide();
    };

    return (
        <div className="carousel-container" 
             onTouchStart={onTouchStart} 
             onTouchMove={onTouchMove} 
             onTouchEnd={onTouchEnd}>
            
            {/* Wrapper que usa transform + translateX (Parte 3.4) */}
            <div 
                className="carousel-wrapper" 
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {items.map((item, index) => (
                    <div className="carousel-slide" key={index}>
                        <img src={item.image} alt={item.title} />
                        <div className="carousel-caption">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controles Manuales */}
            <button className="carousel-btn prev" onClick={prevSlide}>❮</button>
            <button className="carousel-btn next" onClick={nextSlide}>❯</button>

            {/* Indicadores Dinámicos */}
            <div className="carousel-dots">
                {items.map((_, index) => (
                    <span 
                        key={index} 
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                    ></span>
                ))}
            </div>
        </div>
    );
};

export default Carousel;