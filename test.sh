rm -rf upstream/ downstream/
mkdir upstream
cd upstream
git init
touch commit-a
git add .
git commit -m "a"
cd ..
git clone upstream downstream
cd upstream
touch commit-b
git add .
git commit -m "b"
cd ..
node examples/pull.js
