import { FormEvent, useRef } from 'react';

export function App() {
    const fileInput = useRef<HTMLInputElement>(null);
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('files', fileInput.current!.files![0]);
        console.log('foobar', formData);
        fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })
            .then(() => console.log('complete'))
            .catch(console.error);
    };
    return (
        <form onSubmit={onSubmit}>
            <input ref={fileInput} type="file" required />
            <button type="submit"> Upload </button>
        </form>
    );
}

export default App;
