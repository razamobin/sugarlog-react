import React, { useState, useEffect } from "react";

const initialPosts = [];

const fetchRecentPosts = async () => {
    try {
        const response = await fetch("http://localhost:8090/posts/recent");
        if (!response.ok) {
            throw new Error("Failed to fetch recent posts");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching recent posts:", error);
        return initialPosts;
    }
};

/*
const initialPosts = [
    {
        id: 102,
        blood_sugar: 118,
        day: "2023-04-05",
        notes: "April 4th 2023 Insulin 50 units Breakfast: Bowl of oatmeal cereal + 1 banana Lunch: Peas + potato and white rice Dinner: Peas + potato and white rice",
    },
    {
        id: 101,
        blood_sugar: 87,
        day: "2023-01-20",
        notes: "January 19, 2023 Insulin: 50 units Breakfast: 1/2 paratha, 1/2 egg omlette. 1/2 cup potato Lunch: Rice and eggplant /potato Dinner: Rice and eggplant potato Exercise: 20 minutes walk am and pm",
    },
];
*/

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

// Helper function to get the month name
const getMonthName = (monthIndex) => {
    return months[monthIndex];
};

const formatDate = (dateString) => {
    const date = new Date(dateString + "T00:00:00Z"); // Ensure the date is interpreted as UTC

    // Helper function to get the month name
    const getMonthName = (monthIndex) => {
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        return months[monthIndex];
    };

    // Helper function to get the ordinal suffix for a day
    const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return "th"; // Special case for 11-20
        switch (day % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    };

    const month = getMonthName(date.getUTCMonth()); // Use getUTCMonth() to avoid timezone issues
    const day = date.getUTCDate(); // Use getUTCDate() to avoid timezone issues
    const formattedDate = `${month} ${day}${getOrdinalSuffix(day)}`;

    return formattedDate;
};

export default function App() {
    const [allPosts, setAllPosts] = useState(initialPosts);
    const [showNewPostForm, setShowNewPostForm] = useState(false);

    useEffect(() => {
        const getRecentPosts = async () => {
            const recentPosts = await fetchRecentPosts();
            setAllPosts(recentPosts);
        };
        getRecentPosts();
    }, []);

    function addNewPost(newPost) {
        setAllPosts(function (ap) {
            return [newPost, ...ap];
        });
    }

    function toggleNewPostForm() {
        setShowNewPostForm((s) => !s);
    }

    return (
        <>
            <Header />
            <div className="container">
                <Button onClick={toggleNewPostForm}>
                    {showNewPostForm ? "close" : "new post"}
                </Button>
            </div>
            {showNewPostForm && (
                <NewPost
                    addNewPost={addNewPost}
                    toggleNewPostForm={toggleNewPostForm}
                />
            )}
            <PostsList allPosts={allPosts} />
        </>
    );
}

function Button({ onClick, children }) {
    if (onClick) {
        return (
            <button onClick={onClick} className="button styled-button">
                {children}
            </button>
        );
    } else {
        return <button className="button">{children}</button>;
    }
}

function Header() {
    return (
        <div id="header">
            <h1>
                sugar<span>log</span>
            </h1>
        </div>
    );
}

/*
function NewPost() {
    */

function convertToISODate(dateString) {
    const date = new Date(dateString);

    // Get the year, month, and day from the Date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-based, so add 1
    const day = String(date.getDate()).padStart(2, "0");

    // Construct the ISO date string
    const isoDate = `${year}-${month}-${day}`;

    return isoDate;
}

function NewPost({ addNewPost, toggleNewPostForm }) {
    const currentDate = new Date();

    const [selectedMonth, setCurrentMonth] = useState(
        getMonthName(currentDate.getMonth())
    );
    const [selectedDay, setCurrentDay] = useState(currentDate.getDate());
    const [selectedYear, setCurrentYear] = useState(currentDate.getFullYear());

    const [bloodSugar, setBloodSugar] = useState("");
    const [notes, setNotes] = useState("");

    const years = [];
    for (let year = currentDate.getFullYear() - 1; year <= 2100; year++) {
        years.push(year);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!bloodSugar || !notes) {
            return;
        }

        /*
    {
        id: 2,
        blood_sugar: 118,
        day: "2023-04-05",
        notes: "April 4th 2023 Insulin 50 units Breakfast: Bowl of oatmeal cereal + 1 banana Lunch: Peas + potato and white rice Dinner: Peas + potato and white rice",
    },
    */

        const newPost = {
            blood_sugar: bloodSugar,
            day: convertToISODate(
                `${selectedMonth} ${selectedDay} ${selectedYear}`
            ),
            notes: notes,
        };

        try {
            const response = await fetch("http://localhost:8090/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newPost),
            });
            if (response.ok) {
                const savedPost = await response.json();
                console.log(savedPost);
                addNewPost(savedPost);
            } else {
                console.error("Failed to save post:", response.statusText);
            }
        } catch (error) {
            console.error("Error saving post:", error);
        }

        //console.log(newPost);

        //addNewPost(newPost);

        // clear form back to original state
        setCurrentMonth(getMonthName(new Date().getMonth()));
        setCurrentDay(new Date().getDate());
        setCurrentYear(new Date().getFullYear());

        setBloodSugar("");
        setNotes("");
        /*
    const [selectedDay, setCurrentDay] = useState(currentDate.getDate());
    const [selectedYear, setCurrentYear] = useState(currentDate.getFullYear());

    const [bloodSugar, setBloodSugar] = useState("");
    const [notes, setNotes] = useState("");
    */

        // toggle close form
        toggleNewPostForm();
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <ul>
                    <li>
                        <label>day:</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setCurrentMonth(e.target.value)}
                        >
                            {months.map((m) => (
                                <option key={m}>{m}</option>
                            ))}
                        </select>

                        <select
                            value={selectedDay}
                            onChange={(e) =>
                                setCurrentDay(Number(e.target.value))
                            }
                        >
                            {Array.from({ length: 31 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(e) =>
                                setCurrentYear(Number(e.target.value))
                            }
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </li>
                    <li>
                        <label>blood sugar:</label>
                        <input
                            className="field"
                            type="text"
                            size="2"
                            maxLength="4"
                            value={bloodSugar}
                            onChange={(e) =>
                                setBloodSugar(
                                    e.target.value === ""
                                        ? ""
                                        : Number(e.target.value)
                                )
                            }
                        />
                    </li>
                    <li>
                        <label>notes (food, medicine, exercise, etc):</label>
                        <textarea
                            rows="6"
                            cols="40"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                    </li>
                    <Button onClick={() => {}}>submit</Button>
                </ul>
            </form>
        </div>
    );
}

function PostsList({ allPosts }) {
    return (
        <dl id="posts">
            {allPosts.map((p) => {
                return <Post key={p.id} post={p} />;
            })}
        </dl>
    );
}

function Post({ post }) {
    console.log(post.day);
    console.log(formatDate(post.day));
    return (
        <>
            <dt>
                <span className="blood_sugar">{post.blood_sugar}</span>
            </dt>
            <dd>
                <p className="day" style={{ textTransform: "lowercase" }}>
                    {formatDate(post.day)}
                </p>
                <p className="notes">{post.notes}</p>
            </dd>
        </>
    );
}
