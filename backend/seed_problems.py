import json
from database import SessionLocal
import models
from sqlalchemy.orm import Session

initial_problems = [
    {
        "id": 1,
        "title": "Two Sum",
        "description": "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p><p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p><p><strong>Example 1:</strong><br/>Input: nums = [2,7,11,15], target = 9<br/>Output: [0,1]</p>",
        "initial_code": "def twoSum(nums, target):\n    # Write your code here\n    pass",
        "expected_output": "[[0, 1]]"
    },
    {
        "id": 2,
        "title": "Palindrome Number",
        "description": "<p>Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a <strong>palindrome</strong>, and <code>false</code> otherwise.</p><p>An integer is a palindrome when it reads the same forward and backward.</p><p><strong>Example 1:</strong><br/>Input: x = 121<br/>Output: true</p><p><strong>Example 2:</strong><br/>Input: x = -121<br/>Output: false</p>",
        "initial_code": "def isPalindrome(x):\n    # Write your code here\n    pass",
        "expected_output": "[true, false]"
    },
    {
        "id": 3,
        "title": "Fizz Buzz",
        "description": "<p>Given an integer <code>n</code>, return a string array <code>answer</code> (1-indexed) where:</p><ul><li><code>answer[i] == \"FizzBuzz\"</code> if <code>i</code> is divisible by 3 and 5.</li><li><code>answer[i] == \"Fizz\"</code> if <code>i</code> is divisible by 3.</li><li><code>answer[i] == \"Buzz\"</code> if <code>i</code> is divisible by 5.</li><li><code>answer[i] == str(i)</code> (as a string) if none of the above conditions are true.</li></ul><p><strong>Example 1:</strong><br/>Input: n = 3<br/>Output: [\"1\",\"2\",\"Fizz\"]</p>",
        "initial_code": "def fizzBuzz(n):\n    # Write your code here\n    pass",
        "expected_output": "[\"1\",\"2\",\"Fizz\"]"
    }
]

def seed_db():
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        existing_count = db.query(models.Problem).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} problems. Skipping seed.")
            return

        for prob_data in initial_problems:
            db_prob = models.Problem(**prob_data)
            db.add(db_prob)
            print(f"Adding problem: {prob_data['title']}")
        
        db.commit()
        print("Successfully seeded 3 coding problems into the database!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
