import { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  // handle loading state
  const [isLoading, setIsLoading] = useState(false);
  // debouncing search term to avoid making too many requests
  // by wating for the user to stop typing for a second
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [trendingMovies, setTrendingMovies] = useState([]);
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);

  const API_BASE_URL = "https://api.themoviedb.org/3";

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const API_OPTIONS = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  const fetchMovies = async (query) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Error fetching movies");
      }

      const data = await response.json();

      if (data.response === "False") {
        setErrorMessage(data.Error || "Error fetching movies");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      setErrorMessage("Error fetching movies");
      console.error(`ERROR FETCHING MOVIE:: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {

      const movies = await getTrendingMovies();
      setTrendingMovies(movies);

    } catch (error) {
      console.error(`ERROR FETCHING TRENDING MOVIES:: ${error}`);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, [])

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero-img.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>
        </header>

        {
          trendingMovies.length > 0 && (
            <section className="trending">
              <h2>Trending Movies</h2>
              <ul>
                {trendingMovies.map((movie, index) => (
                  <li key={movie.id}>
                    <p>{index+1}</p>
                    <img src={movie.poster_url} alt={movie.title} />
                  </li>
                ))}
              </ul>
            </section>
          )
        }

        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <section className="all-movies">
          <h2 className="mt-[40px]">All Movies</h2>

          {isLoading ? (
            <p className="text-white">
              <Spinner />
            </p>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
