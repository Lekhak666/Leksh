import { useEffect, useState } from "react";

const APIKEY = import.meta.env.VITE_GIPHY_API;
const fallbackGif = "https://media.giphy.com/media/YaOxRsmrv9IeA/giphy.gif";

const useFetch = (keyword: string) => {
  const [gifUrl, setGifUrl] = useState("");

  useEffect(() => {
    const fetchGif = async () => {
      try {
        if (!keyword || !APIKEY) {
          setGifUrl(fallbackGif);
          return;
        }

        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${APIKEY}&q=${keyword}&limit=25`
        );

        const { data } = await response.json();

        if (!data || data.length === 0) {
          setGifUrl(fallbackGif);
          return;
        }

        const randomGif = data[Math.floor(Math.random() * data.length)];
        setGifUrl(randomGif?.images?.downsized_medium?.url || fallbackGif);
      } catch (error) {
        setGifUrl(fallbackGif);
      }
    };

    fetchGif();
  }, [keyword]);

  return gifUrl;
};

export default useFetch;
