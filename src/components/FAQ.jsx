import { useState } from 'react';


const FAQ = ({ faqs }) => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="max-w-4xl mx-auto py-16 px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-white">
                Frequently Asked Questions
            </h2>
            <div className="flex flex-col gap-4">
                {faqs.map((faq, index) => (
                    <div
                        key={faq.id}
                        className={`glass-card overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-white/10 border-white/30' : ''}`}
                    >
                        <button
                            className="w-full p-6 text-left flex justify-between items-center cursor-pointer group"
                            onClick={() => toggleFAQ(index)}
                            aria-expanded={openIndex === index}
                        >
                            <span className={`text-lg font-semibold transition-colors duration-300 ${openIndex === index ? 'text-blue-400' : 'text-white group-hover:text-blue-300'}`}>
                                {faq.question}
                            </span>
                            <span className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white transition-transform duration-300 ${openIndex === index ? 'rotate-180 bg-blue-500/20 text-blue-400' : ''}`}>
                                {openIndex === index ? '−' : '+'}
                            </span>
                        </button>
                        <div
                            className={`transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <div className="px-6 pb-6 text-slate-300 leading-relaxed">
                                {faq.answer}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;
