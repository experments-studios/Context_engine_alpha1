// game.js

window.onload = function() {
    
    // Canvas ve Engine oluşturma
    // Bu kod, window.onload sayesinde HTML tamamen yüklendikten sonra çalışır.
    const canvas = document.getElementById("renderCanvas"); 

    if (!canvas) {
        console.error("KRİTİK HATA: HTML'de 'renderCanvas' ID'sine sahip bir <canvas> etiketi bulunamadı. Lütfen ID'yi kontrol edin.");
        return; // Canvas yoksa, dur ve daha fazla hata verme
    }

    const engine = new BABYLON.Engine(canvas, true);


    // createScene fonksiyonunu async olarak tanımlıyoruz, çünkü HavokPhysics() bir Promise döndürür.
    const createScene = async function (engine, canvas) {
        
        const scene = new BABYLON.Scene(engine);
        
        // 1. Kamera ve Işıklandırma
        const camera = new BABYLON.ArcRotateCamera(
            "camera", 
            BABYLON.Tools.ToRadians(90), 
            BABYLON.Tools.ToRadians(60), 
            10, 
            BABYLON.Vector3.Zero(), 
            scene
        );
        camera.attachControl(canvas, true);
        
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        // 2. Havok Entegrasyonu (Fizik Motoru)
        // DİKKAT: HavokPhysics() fonksiyonunun HTML'de yüklenmiş olması gerekir.
        const havokInstance = await HavokPhysics(); 
        const hk = new BABYLON.HavokPlugin(true, havokInstance); 
        
        // Sahneye fizik motorunu ve yerçekimini ekle
        scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk); 

        // 3. Statik Zemin (Düzeltilmiş PhysicsBody Oluşturma)
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
        ground.material = new BABYLON.StandardMaterial("groundMat", scene);
        ground.material.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.3);
        
        const groundShape = new BABYLON.PhysicsShapeBox(
            new BABYLON.Vector3(0, -0.01, 0), 
            BABYLON.Quaternion.Identity(), 
            new BABYLON.Vector3(10, 0.02, 10), 
            scene
        );
        
        // Zemin için PhysicsBody'yi doğrudan oluşturun (Statik)
        new BABYLON.PhysicsBody(
            ground, 
            BABYLON.PhysicsMotionType.STATIC, 
            { shape: groundShape, mass: 0, friction: 0.8, restitution: 0.7 }, 
            scene
        );

        // 4. Etkileşimli Top Fırlatma Fonksiyonu
        const throwBall = (position) => {
            const diameter = 0.5 + Math.random() * 0.5; 
            const mass = diameter * 5; 
            
            const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: diameter }, scene);
            ball.position = position.add(new BABYLON.Vector3(0, 0.5, 0)); 
            ball.material = new BABYLON.StandardMaterial("ballMat", scene);
            ball.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
            
            const ballShape = new BABYLON.PhysicsShapeSphere(
                BABYLON.Vector3.Zero(),
                ball.getBoundingInfo().boundingSphere.radius,
                scene
            );

            // Dinamik PhysicsBody'yi doğrudan oluşturun
            const ballBody = new BABYLON.PhysicsBody(
                ball, 
                BABYLON.PhysicsMotionType.DYNAMIC, 
                { shape: ballShape, mass: mass, friction: 0.5, restitution: 0.95 }, 
                scene
            );
            
            // Fırlatma itmesini hazırla
            const impulse = new BABYLON.Vector3(
                (Math.random() - 0.5) * 5, 
                10,                        
                (Math.random() - 0.5) * 5  
            );
            
            // İtme uygulama
            ballBody.applyImpulse(impulse, position);
        };

        // 5. Kullanıcı Etkileşimi (Fare Tıklaması)
        canvas.addEventListener("click", (evt) => {
            const pickResult = scene.pick(evt.clientX, evt.clientY);
            
            if (pickResult.hit && pickResult.pickedMesh === ground) {
                throwBall(pickResult.pickedPoint);
            } else {
                const ray = scene.createPickingRay(evt.clientX, evt.clientY);
                const dropPosition = camera.position.add(ray.direction.scale(5));
                throwBall(dropPosition);
            }
        });

        return scene;
    };

    // Sahneyi başlat ve render döngüsünü başlatmak için Promise'i kullan
    createScene(engine, canvas).then(scene => {
        console.log("3D Fizik Ortamı Başarıyla Hazır ve Render Başladı!");
        
        // 6. Render Döngüsü
        engine.runRenderLoop(function () {
            scene.render();
        });

        // Boyutlandırma
        window.addEventListener("resize", function () {
            engine.resize();
        });

    }).catch(error => {
        console.error("Sahne Başlatılırken Kritik Hata Oluştu:", error);
    });
};

